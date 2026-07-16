// ──────────────────────────────────────────────
// Industrias RUAM – Kanban Route
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const roleGuard = require('../middleware/roleGuard');
const { calculateEVM } = require('../services/evmEngine');
const { emitToAll, emitToRoom } = require('../socket/handler');

const STAGE_NAMES = {
  1: 'Pedido Confirmado',
  2: 'Insumos Comprados',
  3: 'Preparación',
  4: 'Procesamiento Integrado',
  5: 'Despachado / Listo'
};

module.exports = router;

// GET / – Get all orders organized by kanban_stage
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const orders = db.prepare(`
      SELECT o.*, om.prep_type, om.total_material_cost
      FROM orders o
      LEFT JOIN order_materials om ON om.order_id = o.id
      WHERE o.status IN ('active', 'frozen')
      ORDER BY o.updated_at DESC
    `).all();

    const stages = {};
    for (let i = 1; i <= 5; i++) {
      stages[i] = {
        stage: i,
        name: STAGE_NAMES[i],
        orders: orders.filter(o => o.kanban_stage === i)
      };
    }

    res.json({ stages, stage_names: STAGE_NAMES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/advance – Advance order to next stage
router.post('/:id/advance', (req, res) => {
  try {
    const db = require('../config/database');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status === 'frozen') {
      return res.status(400).json({ error: 'Orden congelada por solicitud de cambio pendiente.' });
    }
    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Orden ya completada.' });
    }
    if (order.kanban_stage >= 5) {
      return res.status(400).json({ error: 'Orden ya en la última etapa.' });
    }

    const nextStage = order.kanban_stage + 1;

    // CRITICAL BUSINESS RULE: Quality check required before stage 4
    if (nextStage === 4) {
      const qualityCheck = db.prepare(`
        SELECT * FROM quality_checks
        WHERE order_id = ? AND is_approved = 1
        ORDER BY checked_at DESC LIMIT 1
      `).get(req.params.id);

      if (!qualityCheck) {
        return res.status(400).json({
          error: 'Se requiere checklist de calidad aprobado antes de iniciar el Procesamiento Integrado.',
          requires_quality_check: true
        });
      }
    }

    // Update order
    const updates = {
      kanban_stage: nextStage,
      updated_at: new Date().toISOString()
    };

    if (nextStage === 5) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    db.prepare(`
      UPDATE orders SET kanban_stage = ?, status = COALESCE(?, status),
        completed_at = COALESCE(?, completed_at), updated_at = ?
      WHERE id = ?
    `).run(nextStage, updates.status || null, updates.completed_at || null, updates.updated_at, req.params.id);

    // Insert kanban history
    db.prepare(`
      INSERT INTO kanban_history (order_id, from_stage, to_stage, changed_by, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, order.kanban_stage, nextStage, req.user.id,
      `Avanzado a: ${STAGE_NAMES[nextStage]}`);

    // If completed, trigger EVM calculation
    let evmResult = null;
    if (nextStage === 5) {
      try {
        evmResult = calculateEVM(order.id, db);
        if (evmResult.alert_cost_overrun) {
          emitToAll('alert:cost-overrun', {
            order_id: order.id,
            order_code: order.order_code,
            cpi: evmResult.cpi,
            message: `⚠️ CPI < 1.0 en ${order.order_code}: Sobrecosto detectado (CPI: ${evmResult.cpi})`
          });
        }
      } catch (e) {
        console.error('Error calculating EVM:', e.message);
      }
    }

    // Emit socket event
    emitToAll('kanban:updated', {
      order_id: order.id,
      order_code: order.order_code,
      from_stage: order.kanban_stage,
      to_stage: nextStage,
      stage_name: STAGE_NAMES[nextStage]
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated, evm: evmResult, stage_name: STAGE_NAMES[nextStage] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/retreat – Move order back one stage (admin only)
router.post('/:id/retreat', roleGuard(['admin']), (req, res) => {
  try {
    const db = require('../config/database');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.kanban_stage <= 1) {
      return res.status(400).json({ error: 'No se puede retroceder más.' });
    }

    const prevStage = order.kanban_stage - 1;

    db.prepare(`
      UPDATE orders SET kanban_stage = ?, status = 'active', completed_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(prevStage, req.params.id);

    db.prepare(`
      INSERT INTO kanban_history (order_id, from_stage, to_stage, changed_by, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, order.kanban_stage, prevStage, req.user.id,
      `Retrocedido a: ${STAGE_NAMES[prevStage]}`);

    emitToAll('kanban:updated', {
      order_id: order.id,
      from_stage: order.kanban_stage,
      to_stage: prevStage
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
