// ──────────────────────────────────────────────
// Industrias RUAM – Quality & Maintenance Routes
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { emitToAll, emitToRoom } = require('../socket/handler');

module.exports = router;

// ════════════════════════════════════════════════
// QUALITY CHECKLIST (Pre-processing)
// ════════════════════════════════════════════════

// POST /checklist – Create quality check
router.post('/checklist', (req, res) => {
  try {
    const db = require('../config/database');
    const { order_id, oil_temp_ok, blade_calibration_ok } = req.body;

    if (!order_id) return res.status(400).json({ error: 'Se requiere order_id' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const result = db.prepare(`
      INSERT INTO quality_checks (order_id, operator_id, oil_temp_ok, blade_calibration_ok)
      VALUES (?, ?, ?, ?)
    `).run(order_id, req.user.id, oil_temp_ok ? 1 : 0, blade_calibration_ok ? 1 : 0);

    const check = db.prepare('SELECT * FROM quality_checks WHERE id = ?').get(result.lastInsertRowid);

    // Emit event
    if (check.is_approved) {
      emitToAll('quality:checked', {
        order_id,
        order_code: order.order_code,
        approved: true,
        message: `✅ Checklist aprobado para ${order.order_code} - Freidora desbloqueada`
      });
    } else {
      emitToAll('quality:checked', {
        order_id,
        order_code: order.order_code,
        approved: false,
        message: `⚠️ Checklist NO aprobado para ${order.order_code}`
      });
    }

    res.status(201).json({ quality_check: check });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /checklist/:orderId – Get quality checks for order
router.get('/checklist/:orderId', (req, res) => {
  try {
    const db = require('../config/database');
    const checks = db.prepare(`
      SELECT qc.*, u.display_name as operator_name
      FROM quality_checks qc
      LEFT JOIN users u ON u.id = qc.operator_id
      WHERE qc.order_id = ?
      ORDER BY qc.checked_at DESC
    `).all(req.params.orderId);
    res.json({ quality_checks: checks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// PACKAGING QC (Post-processing)
// ════════════════════════════════════════════════

// POST /packaging – Create packaging QC record
router.post('/packaging', (req, res) => {
  try {
    const db = require('../config/database');
    const { order_id, kg_conforming, kg_waste, sealed_ok } = req.body;

    if (!order_id || kg_conforming === undefined || kg_waste === undefined) {
      return res.status(400).json({ error: 'Se requiere order_id, kg_conforming y kg_waste' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const result = db.prepare(`
      INSERT INTO packaging_qc (order_id, operator_id, kg_conforming, kg_waste, sealed_ok)
      VALUES (?, ?, ?, ?, ?)
    `).run(order_id, req.user.id, kg_conforming, kg_waste, sealed_ok ? 1 : 0);

    const qc = db.prepare('SELECT * FROM packaging_qc WHERE id = ?').get(result.lastInsertRowid);

    const totalKg = parseFloat(kg_conforming) + parseFloat(kg_waste);
    const rejectionIndex = totalKg > 0 ? parseFloat(kg_waste) / totalKg : 0;

    // Emit non-conforming alert
    if (!qc.is_conforming) {
      emitToAll('quality:non-conforming', {
        order_id,
        order_code: order.order_code,
        rejection_index: rejectionIndex,
        message: `🔴 Lote NO CONFORME: ${order.order_code} - Índice de rechazo: ${(rejectionIndex * 100).toFixed(1)}%`
      });
    }

    res.status(201).json({
      packaging_qc: qc,
      rejection_index: parseFloat(rejectionIndex.toFixed(4))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /packaging/:orderId – Get packaging QC for order
router.get('/packaging/:orderId', (req, res) => {
  try {
    const db = require('../config/database');
    const qcs = db.prepare(`
      SELECT pq.*, u.display_name as operator_name
      FROM packaging_qc pq
      LEFT JOIN users u ON u.id = pq.operator_id
      WHERE pq.order_id = ?
      ORDER BY pq.checked_at DESC
    `).all(req.params.orderId);
    res.json({ packaging_qc: qcs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// MAINTENANCE LOGS
// ════════════════════════════════════════════════

// GET /maintenance – List all maintenance logs
router.get('/maintenance', (req, res) => {
  try {
    const db = require('../config/database');
    const logs = db.prepare(`
      SELECT ml.*, u.display_name as operator_name, o.order_code
      FROM maintenance_logs ml
      LEFT JOIN users u ON u.id = ml.operator_id
      LEFT JOIN orders o ON o.id = ml.order_id
      ORDER BY ml.started_at DESC
    `).all();

    // Calculate MTBF/MTTR
    const { getMaintenanceMetrics } = require('../services/maintenanceCalc');
    const metrics = getMaintenanceMetrics(db);

    res.json({ logs, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /maintenance – Create maintenance log (emergency stop)
router.post('/maintenance', (req, res) => {
  try {
    const db = require('../config/database');
    const { order_id, failure_type, description } = req.body;

    if (!failure_type) return res.status(400).json({ error: 'Se requiere failure_type' });

    const VALID_TYPES = ['brazo_presion', 'cuchillas_desafiladas', 'caida_temperatura', 'otro'];
    if (!VALID_TYPES.includes(failure_type)) {
      return res.status(400).json({ error: `Tipo de falla inválido. Válidos: ${VALID_TYPES.join(', ')}` });
    }

    const result = db.prepare(`
      INSERT INTO maintenance_logs (order_id, operator_id, failure_type, description)
      VALUES (?, ?, ?, ?)
    `).run(order_id || null, req.user.id, failure_type, description || null);

    const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(result.lastInsertRowid);

    const FAILURE_LABELS = {
      brazo_presion: 'Brazo de presión trabado',
      cuchillas_desafiladas: 'Cuchillas desafiladas',
      caida_temperatura: 'Caída de temperatura',
      otro: 'Otro'
    };

    emitToAll('maintenance:started', {
      log_id: log.id,
      failure_type: log.failure_type,
      failure_label: FAILURE_LABELS[log.failure_type],
      message: `🚨 PARADA: ${FAILURE_LABELS[log.failure_type]}`
    });

    res.status(201).json({ maintenance_log: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /maintenance/:id/close – Close maintenance event
router.put('/maintenance/:id/close', (req, res) => {
  try {
    const db = require('../config/database');
    const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(req.params.id);

    if (!log) return res.status(404).json({ error: 'Registro no encontrado' });
    if (log.ended_at) return res.status(400).json({ error: 'Parada ya cerrada' });

    const endedAt = new Date().toISOString();
    const startedAt = new Date(log.started_at);
    const durationMinutes = (new Date(endedAt) - startedAt) / (1000 * 60);

    db.prepare(`
      UPDATE maintenance_logs SET ended_at = ?, duration_minutes = ? WHERE id = ?
    `).run(endedAt, parseFloat(durationMinutes.toFixed(2)), req.params.id);

    const updated = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(req.params.id);

    emitToAll('maintenance:closed', {
      log_id: updated.id,
      duration_minutes: updated.duration_minutes,
      message: `✅ Parada cerrada (${updated.duration_minutes.toFixed(1)} min)`
    });

    res.json({ maintenance_log: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
