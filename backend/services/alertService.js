/**
 * backend/services/alertService.js
 * Member 4 – Overflow alert engine
 * Alert shape: { bin_id, location, zone, fill_pct, priority, alert }
 */

const WARNING_THRESHOLD  = 75;
const OVERFLOW_THRESHOLD = 90;

/**
 * Generates alert objects for bins above warning threshold.
 * @param {Array} bins
 * @returns {Array} sorted by fill_pct desc
 */
function generateAlerts(bins) {
  return bins
    .filter(b => b.fill_pct >= WARNING_THRESHOLD)
    .map(b => ({
      bin_id:   b.id,
      location: b.location,
      zone:     b.zone,
      fill_pct: b.fill_pct,
      priority: b.priority,
      alert:    b.fill_pct >= OVERFLOW_THRESHOLD ? 'OVERFLOW_RISK' : 'WARNING',
    }))
    .sort((a, b) => b.fill_pct - a.fill_pct);
}

/**
 * Summary counts per alert level.
 * @param {Array} bins
 */
function alertSummary(bins) {
  return {
    overflow: bins.filter(b => b.fill_pct >= OVERFLOW_THRESHOLD).length,
    warning:  bins.filter(b => b.fill_pct >= WARNING_THRESHOLD && b.fill_pct < OVERFLOW_THRESHOLD).length,
    normal:   bins.filter(b => b.fill_pct < WARNING_THRESHOLD).length,
  };
}

module.exports = { generateAlerts, alertSummary, WARNING_THRESHOLD, OVERFLOW_THRESHOLD };
