// ──────────────────────────────────────────────
// Industrias RUAM – Orders Route
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { calculateBOM, PRESENTATIONS } = require('../services/materialCalc');
const roleGuard = require('../middleware/roleGuard');

module.exports = router;

// GET / – List all orders with materials
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const orders = db.prepare(`
      SELECT o.*, om.raw_material_kg, om.raw_material_cost, om.oil_liters,
             om.oil_cost, om.total_material_cost, om.prep_type
      FROM orders o
      LEFT JOIN order_materials om ON om.order_id = o.id
      ORDER BY o.created_at DESC
    `).all();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /presentations – Get presentation configuration
router.get('/presentations', (req, res) => {
  res.json({ presentations: PRESENTATIONS });
});

// POST / – Create new order by presentation/units (admin only)
router.post('/', roleGuard(['admin']), (req, res) => {
  try {
    const db = require('../config/database');
    const { client_name, snack_type, presentation, units_requested, notes } = req.body;

    if (!client_name || !snack_type || !presentation || !units_requested) {
      return res.status(400).json({ error: 'Se requiere client_name, snack_type, presentation y units_requested' });
    }

    const pres = PRESENTATIONS[presentation];
    if (!pres) {
      return res.status(400).json({ error: `Presentación inválida: "${presentation}". Válidas: ${Object.keys(PRESENTATIONS).join(', ')}` });
    }

    const units = parseInt(units_requested);
    if (units <= 0) {
      return res.status(400).json({ error: 'units_requested debe ser mayor a 0' });
    }

    // Generate order code
    const year = new Date().getFullYear();
    const lastOrder = db.prepare(
      `SELECT order_code FROM orders WHERE order_code LIKE ? ORDER BY id DESC LIMIT 1`
    ).get(`ORD-${year}-%`);

    let nextNum = 1;
    if (lastOrder) {
      const parts = lastOrder.order_code.split('-');
      nextNum = parseInt(parts[2]) + 1;
    }
    const order_code = `ORD-${year}-${String(nextNum).padStart(3, '0')}`;

    // Calculate BOM from presentation + units
    const bom = calculateBOM(snack_type, presentation, units);

    // Insert order
    const orderResult = db.prepare(`
      INSERT INTO orders (order_code, client_name, snack_type, presentation, units_requested, unit_price, kg_requested, revenue_total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_code, client_name, snack_type, presentation, units, bom.unit_price, bom.kg_requested, bom.revenue, notes || null);

    const orderId = orderResult.lastInsertRowid;

    // Insert materials
    db.prepare(`
      INSERT INTO order_materials (order_id, raw_material_kg, raw_material_cost, oil_liters, oil_cost, total_material_cost, prep_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, bom.raw_material_kg, bom.raw_material_cost, bom.oil_liters, bom.oil_cost, bom.total_material_cost, bom.prep_type);

    // Insert initial kanban history
    db.prepare(`
      INSERT INTO kanban_history (order_id, from_stage, to_stage, changed_by, notes)
      VALUES (?, NULL, 1, ?, 'Pedido creado')
    `).run(orderId, req.user.id);

    // Emit socket event
    const { emitToAll } = require('../socket/handler');
    emitToAll('kanban:updated', { order_id: orderId, stage: 1 });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json({ order, materials: bom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id – Get single order with all related data
router.get('/:id', (req, res) => {
  try {
    const db = require('../config/database');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const materials = db.prepare('SELECT * FROM order_materials WHERE order_id = ?').get(req.params.id);
    const kanbanHistory = db.prepare('SELECT kh.*, u.display_name as changed_by_name FROM kanban_history kh LEFT JOIN users u ON u.id = kh.changed_by WHERE kh.order_id = ? ORDER BY kh.created_at').all(req.params.id);
    const qualityChecks = db.prepare('SELECT qc.*, u.display_name as operator_name FROM quality_checks qc LEFT JOIN users u ON u.id = qc.operator_id WHERE qc.order_id = ?').all(req.params.id);
    const packagingQC = db.prepare('SELECT pq.*, u.display_name as operator_name FROM packaging_qc pq LEFT JOIN users u ON u.id = pq.operator_id WHERE pq.order_id = ?').all(req.params.id);
    const evmRecord = db.prepare('SELECT * FROM evm_records WHERE order_id = ?').get(req.params.id);
    const maintenanceLogs = db.prepare('SELECT ml.*, u.display_name as operator_name FROM maintenance_logs ml LEFT JOIN users u ON u.id = ml.operator_id WHERE ml.order_id = ?').all(req.params.id);
    const changeRequests = db.prepare('SELECT * FROM change_requests WHERE order_id = ?').all(req.params.id);

    res.json({
      order, materials, kanban_history: kanbanHistory,
      quality_checks: qualityChecks, packaging_qc: packagingQC,
      evm: evmRecord, maintenance_logs: maintenanceLogs,
      change_requests: changeRequests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id – Update order (admin only)
router.put('/:id', roleGuard(['admin']), (req, res) => {
  try {
    const db = require('../config/database');
    const { client_name, snack_type, presentation, units_requested, notes, status } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // If units or presentation changed, recalculate everything
    if (snack_type || presentation || units_requested) {
      const newType = snack_type || order.snack_type;
      const newPres = presentation || order.presentation;
      const newUnits = units_requested ? parseInt(units_requested) : order.units_requested;

      const bom = calculateBOM(newType, newPres, newUnits);

      db.prepare(`
        UPDATE orders SET
          client_name = COALESCE(?, client_name),
          snack_type = ?, presentation = ?, units_requested = ?,
          unit_price = ?, kg_requested = ?, revenue_total = ?,
          notes = COALESCE(?, notes), status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(client_name, newType, newPres, newUnits, bom.unit_price, bom.kg_requested, bom.revenue, notes, status, req.params.id);

      // Recalculate materials
      db.prepare('DELETE FROM order_materials WHERE order_id = ?').run(req.params.id);
      db.prepare(`
        INSERT INTO order_materials (order_id, raw_material_kg, raw_material_cost, oil_liters, oil_cost, total_material_cost, prep_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.params.id, bom.raw_material_kg, bom.raw_material_cost, bom.oil_liters, bom.oil_cost, bom.total_material_cost, bom.prep_type);
    } else {
      db.prepare(`
        UPDATE orders SET
          client_name = COALESCE(?, client_name),
          notes = COALESCE(?, notes), status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(client_name, notes, status, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/materials – Get calculated materials for order
router.get('/:id/materials', (req, res) => {
  try {
    const db = require('../config/database');
    const materials = db.prepare('SELECT * FROM order_materials WHERE order_id = ?').get(req.params.id);
    if (!materials) return res.status(404).json({ error: 'Materiales no encontrados' });
    res.json({ materials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
