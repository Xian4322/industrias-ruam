// ──────────────────────────────────────────────
// Industrias RUAM – Earned Value Management Engine
// ──────────────────────────────────────────────

const { RECIPES } = require('./materialCalc');

const WORKING_DAY_HOURS = 8;

// Differentiated labor rates (S/. per day)
const LABOR_RATES = {
  operario_general: 60.00,   // Operarios 1, 3, 4
  operario_fritura: 70.00    // Operario 2 - riesgo térmico
};

// Estimated hours per stage per standard 50kg lot
const STAGE_HOURS = {
  1: { description: 'Pedido Confirmado', hours: 0.5, operator_type: 'general' },
  2: { description: 'Insumos Comprados', hours: 1.0, operator_type: 'general' },
  3: { description: 'Preparación', hours: null, operator_type: 'general' },       // Uses prep_hours from recipe
  4: { description: 'Procesamiento Integrado', hours: 2.0, operator_type: 'fritura' }, // Operario 2
  5: { description: 'Despachado / Listo', hours: 1.5, operator_type: 'general' }
};

/**
 * Calculate EVM metrics for a specific order.
 * PV is now based on the order's revenue_total (unit price × units).
 */
function calculateEVM(orderId, db) {
  const order = db.prepare(`
    SELECT o.*, om.raw_material_cost, om.oil_cost, om.total_material_cost, om.prep_type
    FROM orders o
    LEFT JOIN order_materials om ON om.order_id = o.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    throw new Error(`Orden ${orderId} no encontrada`);
  }

  const recipe = RECIPES[order.snack_type];
  const lotFactor = order.kg_requested / 50;

  // ── Planned Value (PV) = revenue from sales ─
  const pv = order.revenue_total || 0;

  // ── Earned Value (EV) ──────────────────────
  const ev = pv * (order.kanban_stage / 5);

  // ── Actual Cost (AC) ───────────────────────
  const material_cost = order.raw_material_cost || 0;
  const oil_cost_actual = order.oil_cost || 0;

  // Calculate labor cost with differentiated rates
  let labor_cost = 0;
  for (let stage = 1; stage <= order.kanban_stage; stage++) {
    const stageInfo = STAGE_HOURS[stage];
    let hours;

    if (stage === 3 && recipe) {
      // Preparation stage uses recipe-specific hours (pelado vs lavado)
      hours = recipe.prep_hours_per_50kg * lotFactor;
    } else {
      hours = (stageInfo.hours || 1.0) * lotFactor;
    }

    const hourlyRate = stageInfo.operator_type === 'fritura'
      ? LABOR_RATES.operario_fritura / WORKING_DAY_HOURS
      : LABOR_RATES.operario_general / WORKING_DAY_HOURS;

    labor_cost += hours * hourlyRate;
  }

  // Add maintenance downtime cost (operator idle time during failures)
  const maintenanceLogs = db.prepare(`
    SELECT SUM(duration_minutes) as total_downtime
    FROM maintenance_logs
    WHERE order_id = ? AND ended_at IS NOT NULL
  `).get(orderId);

  if (maintenanceLogs && maintenanceLogs.total_downtime) {
    const downtimeHours = maintenanceLogs.total_downtime / 60;
    labor_cost += downtimeHours * (LABOR_RATES.operario_fritura / WORKING_DAY_HOURS);
  }

  const ac = material_cost + oil_cost_actual + labor_cost;

  // ── EVM Metrics ────────────────────────────
  const cv = ev - ac;
  const sv = ev - pv;
  const cpi = ac > 0 ? ev / ac : 0;
  const spi = pv > 0 ? ev / pv : 0;

  // ── Store in database ──────────────────────
  const existing = db.prepare('SELECT id FROM evm_records WHERE order_id = ?').get(orderId);

  if (existing) {
    db.prepare(`
      UPDATE evm_records SET
        pv = ?, ev = ?, ac = ?, cv = ?, sv = ?, cpi = ?, spi = ?,
        labor_cost = ?, material_cost = ?, oil_cost_actual = ?,
        calculated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `).run(pv, ev, ac, cv, sv, cpi, spi, labor_cost, material_cost, oil_cost_actual, orderId);
  } else {
    db.prepare(`
      INSERT INTO evm_records (order_id, pv, ev, ac, cv, sv, cpi, spi, labor_cost, material_cost, oil_cost_actual)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, pv, ev, ac, cv, sv, cpi, spi, labor_cost, material_cost, oil_cost_actual);
  }

  const alertCostOverrun = cpi > 0 && cpi < 1.0;

  return {
    order_id: orderId,
    order_code: order.order_code,
    snack_type: order.snack_type,
    presentation: order.presentation,
    units_requested: order.units_requested,
    kg_requested: order.kg_requested,
    revenue_total: order.revenue_total,
    kanban_stage: order.kanban_stage,
    pv: parseFloat(pv.toFixed(2)),
    ev: parseFloat(ev.toFixed(2)),
    ac: parseFloat(ac.toFixed(2)),
    cv: parseFloat(cv.toFixed(2)),
    sv: parseFloat(sv.toFixed(2)),
    cpi: parseFloat(cpi.toFixed(4)),
    spi: parseFloat(spi.toFixed(4)),
    labor_cost: parseFloat(labor_cost.toFixed(2)),
    material_cost: parseFloat(material_cost.toFixed(2)),
    oil_cost_actual: parseFloat(oil_cost_actual.toFixed(2)),
    alert_cost_overrun: alertCostOverrun
  };
}

function getEVMByOrder(orderId, db) {
  return db.prepare(`
    SELECT e.*, o.order_code, o.snack_type, o.presentation, o.units_requested, o.kg_requested, o.kanban_stage, o.revenue_total
    FROM evm_records e
    JOIN orders o ON o.id = e.order_id
    WHERE e.order_id = ?
  `).get(orderId);
}

function getAllEVM(db) {
  return db.prepare(`
    SELECT e.*, o.order_code, o.snack_type, o.presentation, o.units_requested, o.kg_requested, o.kanban_stage, o.status, o.revenue_total
    FROM evm_records e
    JOIN orders o ON o.id = e.order_id
    ORDER BY e.calculated_at DESC
  `).all();
}

module.exports = {
  calculateEVM,
  getEVMByOrder,
  getAllEVM,
  LABOR_RATES,
  STAGE_HOURS
};
