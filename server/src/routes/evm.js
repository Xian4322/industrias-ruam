// ──────────────────────────────────────────────
// Industrias RUAM – EVM Routes
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { getAllEVM, getEVMByOrder, calculateEVM } = require('../services/evmEngine');
const { emitToAll } = require('../socket/handler');

// GET / – List all EVM records
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const records = getAllEVM(db);
    res.json({ evm_records: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:orderId – Get EVM for a specific order
router.get('/:orderId', (req, res) => {
  try {
    const db = require('../config/database');
    const record = getEVMByOrder(req.params.orderId, db);
    if (!record) {
      return res.status(404).json({ error: 'No se encontró registro EVM para esta orden' });
    }
    res.json({ evm: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /calculate/:orderId – Calculate EVM for an order
router.post('/calculate/:orderId', (req, res) => {
  try {
    const db = require('../config/database');
    const evmResult = calculateEVM(req.params.orderId, db);

    // If CPI < 1.0, emit cost-overrun alert IMMEDIATELY via Socket.io
    if (evmResult.alert_cost_overrun) {
      emitToAll('alert:cost-overrun', {
        order_id: evmResult.order_id,
        order_code: evmResult.order_code,
        cpi: evmResult.cpi,
        cv: evmResult.cv,
        message: `⚠️ ALERTA: CPI < 1.0 en ${evmResult.order_code} (CPI: ${evmResult.cpi.toFixed(4)}, CV: S/. ${evmResult.cv.toFixed(2)})`
      });
    }

    res.json({ evm: evmResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
