/**
 * backend/services/simulationService.js
 * Member 2 – IoT sensor simulation
 * Generates random fill levels for all bins (mimics real IoT sensors).
 */
const { calculatePriority } = require('./priorityService');

/**
 * Generates new fill_pct and priority for every bin.
 * @param {Array} bins  master bin list from data/bins.json
 * @returns {Array} bins with fill_pct and priority added
 */
function simulateBins(bins) {
  return bins.map(bin => {
    const fill_pct = parseFloat((Math.random() * 100).toFixed(2));
    return {
      ...bin,
      fill_pct,
      priority: calculatePriority(fill_pct),
      simulated_at: new Date().toISOString(),
    };
  });
}

module.exports = { simulateBins };
