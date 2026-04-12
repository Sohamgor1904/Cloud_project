/**
 * backend/services/predictionService.js
 * Member 4 – Overflow time prediction
 * Models fill rate per bin and estimates hours to overflow.
 */

const rateCache = new Map();  // bin_id → fill rate (%/hr)

function getFillRate(binId) {
  if (!rateCache.has(binId)) {
    rateCache.set(binId, parseFloat((0.5 + Math.random() * 2.5).toFixed(2)));
  }
  return rateCache.get(binId);
}

/**
 * Returns overflow predictions for all bins, sorted soonest first.
 * @param {Array} bins
 * @returns {Array}
 */
function predictOverflow(bins) {
  return bins
    .map(bin => {
      const rate     = getFillRate(bin.id);
      const hoursLeft = parseFloat(((100 - bin.fill_pct) / rate).toFixed(1));
      return {
        bin_id:       bin.id,
        location:     bin.location,
        zone:         bin.zone,
        fill_pct:     bin.fill_pct,
        fill_rate:    rate,
        hours_to_full: hoursLeft,
        projected_2h: parseFloat(Math.min(bin.fill_pct + rate * 2, 100).toFixed(1)),
        projected_4h: parseFloat(Math.min(bin.fill_pct + rate * 4, 100).toFixed(1)),
        projected_8h: parseFloat(Math.min(bin.fill_pct + rate * 8, 100).toFixed(1)),
        alert_level:  hoursLeft < 2 ? 'OVERFLOW_RISK' : hoursLeft < 6 ? 'WARNING' : 'NORMAL',
      };
    })
    .sort((a, b) => a.hours_to_full - b.hours_to_full);
}

module.exports = { predictOverflow };
