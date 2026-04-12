/**
 * backend/services/priorityService.js
 * Member 4 – Priority formula
 * Formula: priority = (fill_pct × 0.1) + urgency_noise(0–2)
 */

/**
 * Calculates a priority score for a bin.
 * @param {number} fill_pct  0–100
 * @returns {number} priority rounded to 2dp, range 0–12
 */
function calculatePriority(fill_pct) {
  const base  = parseFloat(fill_pct) * 0.1;  // 0–10 scale
  const noise = Math.random() * 2;            // 0–2 urgency factor
  return parseFloat((base + noise).toFixed(2));
}

module.exports = { calculatePriority };
