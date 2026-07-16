// ──────────────────────────────────────────────
// Industrias RUAM – Maintenance Metrics Calculator
// ──────────────────────────────────────────────

const DEFAULT_OPERATING_HOURS_PER_DAY = 8;
const DEFAULT_OPERATING_DAYS = 30;

/**
 * Calculate MTBF (Mean Time Between Failures).
 * MTBF = Total operating hours / Number of failures
 */
function calculateMTBF(maintenanceLogs, totalOperatingHours) {
  const failures = maintenanceLogs.filter(log => log.ended_at !== null);
  if (failures.length === 0) return totalOperatingHours;
  return totalOperatingHours / failures.length;
}

/**
 * Calculate MTTR (Mean Time To Repair).
 * MTTR = Total repair time / Number of failures
 */
function calculateMTTR(maintenanceLogs) {
  const completedLogs = maintenanceLogs.filter(log =>
    log.ended_at !== null && log.duration_minutes !== null
  );
  if (completedLogs.length === 0) return 0;

  const totalRepairMinutes = completedLogs.reduce(
    (sum, log) => sum + (log.duration_minutes || 0), 0
  );
  return totalRepairMinutes / completedLogs.length;
}

/**
 * Calculate machine availability.
 * Availability = MTBF / (MTBF + MTTR)
 * Both must be in the same units (minutes or hours).
 */
function calculateAvailability(mtbf, mttr) {
  if (mtbf + mttr === 0) return 1.0;
  return mtbf / (mtbf + mttr);
}

/**
 * Get comprehensive maintenance metrics from the database.
 */
function getMaintenanceMetrics(db) {
  const logs = db.prepare(`
    SELECT * FROM maintenance_logs ORDER BY started_at DESC
  `).all();

  const completedLogs = logs.filter(l => l.ended_at !== null);
  const activeLogs = logs.filter(l => l.ended_at === null);

  // Estimate total operating hours (last 30 days)
  const totalOperatingHours = DEFAULT_OPERATING_HOURS_PER_DAY * DEFAULT_OPERATING_DAYS;
  const totalOperatingMinutes = totalOperatingHours * 60;

  const mtbfMinutes = calculateMTBF(logs, totalOperatingMinutes);
  const mttrMinutes = calculateMTTR(logs);
  const availability = calculateAvailability(mtbfMinutes, mttrMinutes);

  // Failure type breakdown
  const failureBreakdown = {};
  logs.forEach(log => {
    if (!failureBreakdown[log.failure_type]) {
      failureBreakdown[log.failure_type] = { count: 0, total_minutes: 0 };
    }
    failureBreakdown[log.failure_type].count++;
    if (log.duration_minutes) {
      failureBreakdown[log.failure_type].total_minutes += log.duration_minutes;
    }
  });

  return {
    total_events: logs.length,
    completed_events: completedLogs.length,
    active_events: activeLogs.length,
    mtbf_hours: parseFloat((mtbfMinutes / 60).toFixed(2)),
    mttr_minutes: parseFloat(mttrMinutes.toFixed(2)),
    availability: parseFloat(availability.toFixed(4)),
    failure_breakdown: failureBreakdown,
    recent_logs: logs.slice(0, 10)
  };
}

module.exports = {
  calculateMTBF,
  calculateMTTR,
  calculateAvailability,
  getMaintenanceMetrics
};
