// ──────────────────────────────────────────────
// Industrias RUAM – Alert & KPI Evaluation Engine
// ──────────────────────────────────────────────

const THRESHOLDS = {
  availability: { green: 0.95, yellow: 0.85, unit: '%', inverse: false },
  otif:         { green: 0.95, yellow: 0.85, unit: '%', inverse: false },
  rejection:    { green: 0.025, yellow: 0.05, unit: '%', inverse: true },
  cost_per_kg:  { green: 6.50, yellow: 8.00, unit: 'S/.', inverse: true }
};

/**
 * Evaluate a single KPI metric.
 * For normal metrics (higher = better): >= green threshold → green, >= yellow → yellow, else red
 * For inverse metrics (lower = better): <= green threshold → green, <= yellow → yellow, else red
 */
function evaluateKPI(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return 'yellow';

  if (threshold.inverse) {
    if (value <= threshold.green) return 'green';
    if (value <= threshold.yellow) return 'yellow';
    return 'red';
  } else {
    if (value >= threshold.green) return 'green';
    if (value >= threshold.yellow) return 'yellow';
    return 'red';
  }
}

/**
 * Evaluate all KPIs at once.
 */
function evaluateAllKPIs(metrics) {
  const results = {};
  for (const [key, value] of Object.entries(metrics)) {
    if (THRESHOLDS[key]) {
      results[key] = {
        value: parseFloat(value.toFixed(4)),
        status: evaluateKPI(key, value),
        threshold: THRESHOLDS[key]
      };
    }
  }
  return results;
}

/**
 * Check if CPI indicates cost overrun.
 */
function checkCPIAlert(cpi) {
  return cpi > 0 && cpi < 1.0;
}

/**
 * Get the emoji for a status level.
 */
function getStatusEmoji(status) {
  const emojis = { green: '🟢', yellow: '🟡', red: '🔴' };
  return emojis[status] || '⚪';
}

module.exports = {
  THRESHOLDS,
  evaluateKPI,
  evaluateAllKPIs,
  checkCPIAlert,
  getStatusEmoji
};
