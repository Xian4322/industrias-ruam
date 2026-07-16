// ──────────────────────────────────────────────
// Industrias RUAM – Change Requests Route
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const roleGuard = require('../middleware/roleGuard');
const { calculateBOM } = require('../services/materialCalc');
const { emitToAll } = require('../socket/handler');

module.exports = router;

// GET / – List all change requests with order info
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const changes = db.prepare(`
      SELECT cr.*, o.order_code, o.client_name, o.snack_type, o.presentation,
             o.units_requested, o.kg_requested, o.status as order_status,
             u1.display_name as requested_by_name,
             u2.display_name as approved_by_name
      FROM change_requests cr
      JOIN orders o ON cr.order_id = o.id
      LEFT JOIN users u1 ON cr.requested_by = u1.id
      LEFT JOIN users u2 ON cr.approved_by = u2.id
      ORDER BY cr.created_at DESC
    `).all();
    res.json({ change_requests: changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / – Create change request and freeze order
router.post('/', (req, res) => {
  try {
    const db = require('../config/database');
    const { order_id, reason, cost_impact, time_impact_days, new_units, new_presentation, new_snack_type } = req.body;

    if (!order_id || !reason) {
      return res.status(400).json({ error: 'Se requiere order_id y reason' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const result = db.prepare(`
      INSERT INTO change_requests (order_id, requested_by, reason, cost_impact, time_impact_days, new_units, new_presentation, new_snack_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_id, req.user.id, reason, cost_impact || 0, time_impact_days || 0, new_units || null, new_presentation || null, new_snack_type || null);

    // Freeze the order
    db.prepare("UPDATE orders SET status = 'frozen', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order_id);

    emitToAll('order:frozen', {
      order_id,
      order_code: order.order_code,
      message: `🧊 Orden ${order.order_code} congelada por solicitud de cambio`
    });

    const changeRequest = db.prepare('SELECT * FROM change_requests WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ change_request: changeRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/approve – Approve change request (admin only)
router.put('/:id/approve', roleGuard(['admin']), (req, res) => {
  try {
    const db = require('../config/database');
    const cr = db.prepare('SELECT * FROM change_requests WHERE id = ?').get(req.params.id);
    if (!cr) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (cr.status !== 'pending') return res.status(400).json({ error: `Solicitud ya procesada: ${cr.status}` });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(cr.order_id);

    // Approve the change
    db.prepare(`
      UPDATE change_requests SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, req.params.id);

    // Apply changes to order
    if (cr.new_units || cr.new_presentation || cr.new_snack_type) {
      const newUnits = cr.new_units || order.units_requested;
      const newPres = cr.new_presentation || order.presentation;
      const newType = cr.new_snack_type || order.snack_type;

      const bom = calculateBOM(newType, newPres, newUnits);

      db.prepare(`
        UPDATE orders SET snack_type = ?, presentation = ?, units_requested = ?,
          unit_price = ?, kg_requested = ?, revenue_total = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(newType, newPres, newUnits, bom.unit_price, bom.kg_requested, bom.revenue, cr.order_id);

      // Recalculate materials
      db.prepare('DELETE FROM order_materials WHERE order_id = ?').run(cr.order_id);
      db.prepare(`
        INSERT INTO order_materials (order_id, raw_material_kg, raw_material_cost, oil_liters, oil_cost, total_material_cost, prep_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(cr.order_id, bom.raw_material_kg, bom.raw_material_cost, bom.oil_liters, bom.oil_cost, bom.total_material_cost, bom.prep_type);
    }

    // Unfreeze order
    db.prepare("UPDATE orders SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(cr.order_id);

    emitToAll('change:approved', {
      change_id: parseInt(req.params.id),
      order_code: order.order_code,
      message: `✅ Cambio #${req.params.id} aprobado para ${order.order_code}`
    });

    const updated = db.prepare('SELECT * FROM change_requests WHERE id = ?').get(req.params.id);
    res.json({ change_request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/reject – Reject change request (admin only)
router.put('/:id/reject', roleGuard(['admin']), (req, res) => {
  try {
    const db = require('../config/database');
    const cr = db.prepare('SELECT * FROM change_requests WHERE id = ?').get(req.params.id);
    if (!cr) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (cr.status !== 'pending') return res.status(400).json({ error: `Solicitud ya procesada: ${cr.status}` });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(cr.order_id);

    db.prepare(`
      UPDATE change_requests SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, req.params.id);

    // Unfreeze order
    db.prepare("UPDATE orders SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(cr.order_id);

    emitToAll('change:rejected', {
      change_id: parseInt(req.params.id),
      order_code: order ? order.order_code : null,
      message: `❌ Cambio #${req.params.id} rechazado`
    });

    const updated = db.prepare('SELECT * FROM change_requests WHERE id = ?').get(req.params.id);
    res.json({ change_request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
