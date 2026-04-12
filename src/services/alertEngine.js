/**
 * SmartWaste — services/alertEngine.js
 * Member 4 — Logic, AI & Extras
 *
 * Overflow alert engine.
 * Scans current bin fill levels and generates alert objects
 * for bins above thresholds.
 *
 * Alert shape (locked with Member 1 on Day 3):
 *   { bin_id, location, fill_pct, alert: "OVERFLOW_RISK" | "WARNING" }
 */

// ── THRESHOLDS ────────────────────────────────────────────────────────────
const OVERFLOW_THRESHOLD = 90;   // % — OVERFLOW_RISK
const WARNING_THRESHOLD  = 75;   // % — WARNING

/**
 * Scans bins and returns alert objects for any above threshold.
 *
 * @param {Array} bins - array of { id, location, fill_pct, zone, ... }
 * @returns {Array} alert objects sorted by fill_pct descending
 */
function generateAlerts(bins) {
  return bins
    .filter(bin => bin.fill_pct >= WARNING_THRESHOLD)
    .map(bin => ({
      bin_id:   bin.id,
      location: bin.location,
      zone:     bin.zone  || null,
      fill_pct: bin.fill_pct,
      priority: bin.priority || null,
      alert:    bin.fill_pct >= OVERFLOW_THRESHOLD ? 'OVERFLOW_RISK' : 'WARNING',
    }))
    .sort((a, b) => b.fill_pct - a.fill_pct);   // most critical first
}

/**
 * Returns counts of bins at each severity level.
 *
 * @param {Array} bins
 * @returns {{ overflow: number, warning: number, normal: number }}
 */
function alertSummary(bins) {
  return {
    overflow: bins.filter(b => b.fill_pct >= OVERFLOW_THRESHOLD).length,
    warning:  bins.filter(b => b.fill_pct >= WARNING_THRESHOLD && b.fill_pct < OVERFLOW_THRESHOLD).length,
    normal:   bins.filter(b => b.fill_pct < WARNING_THRESHOLD).length,
  };
}

module.exports = { generateAlerts, alertSummary, OVERFLOW_THRESHOLD, WARNING_THRESHOLD };
