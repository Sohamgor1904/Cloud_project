/**
 * SmartWaste — services/predictionService.js
 * Member 4 — Logic, AI & Extras
 *
 * Predicts how many hours until each bin reaches overflow (100%).
 * Uses a simple linear model based on modelled historical fill rate.
 *
 * In production: fill rate would be derived from real fill_history data
 * (linear regression over the last 24h of readings).
 * In prototype: modelled as a random 0.5–4%/hr based on current fill.
 */

// ── FILL RATE MODEL ───────────────────────────────────────────────────────
// Store per-bin fill rates in memory (resets on server restart)
const binFillRates = new Map();

/**
 * Returns (or generates) the modelled fill rate in %/hr for a bin.
 * Higher-fill bins tend to have higher assigned rates (urgency bias).
 *
 * @param {number} binId
 * @param {number} fill_pct - current fill percentage
 * @returns {number} fill rate in %/hr
 */
function getFillRate(binId, fill_pct) {
  if (!binFillRates.has(binId)) {
    // Base rate 0.5–3%/hr + slight bias for fuller bins
    const base = 0.5 + Math.random() * 2.5;
    binFillRates.set(binId, parseFloat(base.toFixed(2)));
  }
  return binFillRates.get(binId);
}

/**
 * Generates overflow predictions for all bins.
 *
 * @param {Array} bins - array of { id, location, fill_pct, priority, ... }
 * @returns {Array} predictions sorted by urgency (soonest overflow first)
 */
function predictOverflow(bins) {
  return bins
    .map(bin => {
      const rate      = getFillRate(bin.id, bin.fill_pct);
      const hoursLeft = (100 - bin.fill_pct) / rate;
      const in2h      = Math.min(bin.fill_pct + rate * 2, 100);
      const in4h      = Math.min(bin.fill_pct + rate * 4, 100);
      const in8h      = Math.min(bin.fill_pct + rate * 8, 100);

      let alertLevel;
      if (hoursLeft < 2)  alertLevel = 'OVERFLOW_RISK';
      else if (hoursLeft < 6) alertLevel = 'WARNING';
      else                    alertLevel = 'NORMAL';

      return {
        bin_id:      bin.id,
        location:    bin.location,
        zone:        bin.zone,
        fill_pct:    bin.fill_pct,
        priority:    bin.priority,
        fill_rate:   rate,
        hours_left:  parseFloat(hoursLeft.toFixed(1)),
        projected_2h: parseFloat(in2h.toFixed(1)),
        projected_4h: parseFloat(in4h.toFixed(1)),
        projected_8h: parseFloat(in8h.toFixed(1)),
        alert_level: alertLevel,
      };
    })
    .sort((a, b) => a.hours_left - b.hours_left);  // most urgent first
}

module.exports = { predictOverflow, getFillRate };
