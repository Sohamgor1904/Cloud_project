/**
 * backend/services/routeService.js
 * Member 4 – Route generation algorithm
 * Filters candidates by priority threshold, orders by greedy nearest-neighbour.
 */

const PRIORITY_THRESHOLD = 7.0;
const ROUTE_TOP_N        = 10;
const DEPOT              = { lat: 23.1648, lng: 72.6800 };  // GIFT City gate
const FILL_WEIGHT        = 0.60;
const DIST_WEIGHT        = 0.40;

// Haversine great-circle distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R   = 6371;
  const toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Greedy nearest-neighbour route optimisation.
 * Score = FILL_WEIGHT × normFill − DIST_WEIGHT × normDist
 * At every step the truck picks the unvisited bin with the highest score.
 *
 * @param {Array} candidates  bins already filtered by priority threshold
 * @returns {Array} ordered route with .rank field set
 */
function greedyOptimizeRoute(candidates) {
  if (!candidates.length) return [];
  let curLat = DEPOT.lat, curLng = DEPOT.lng;
  const unvisited = [...candidates];
  const ordered   = [];

  while (unvisited.length > 0) {
    const dists   = unvisited.map(b => haversineKm(curLat, curLng, b.lat, b.lng));
    const maxDist = Math.max(...dists) || 1;
    const fills   = unvisited.map(b => b.fill_pct);
    const maxFill = Math.max(...fills);
    const minFill = Math.min(...fills);
    const span    = (maxFill - minFill) || 1;

    let best = -Infinity, bestIdx = 0;
    unvisited.forEach((bin, i) => {
      const score = FILL_WEIGHT * (bin.fill_pct - minFill) / span
                  - DIST_WEIGHT * dists[i] / maxDist;
      if (score > best) { best = score; bestIdx = i; }
    });

    const chosen = unvisited.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    curLat = chosen.lat;
    curLng = chosen.lng;
  }
  return ordered.map((b, i) => ({ ...b, rank: i + 1 }));
}

/**
 * Full route generation:
 *   1. Filter bins by priority threshold
 *   2. Take top N by priority
 *   3. Optimise visit order via greedy algorithm
 *
 * @param {Array} bins  bins with fill_pct and priority
 * @returns {Array} ordered route
 */
function generateRoute(bins, threshold = PRIORITY_THRESHOLD, topN = ROUTE_TOP_N) {
  const candidates = [...bins]
    .filter(b => b.priority >= threshold)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, topN);
  return greedyOptimizeRoute(candidates);
}

module.exports = { generateRoute, haversineKm, PRIORITY_THRESHOLD, ROUTE_TOP_N };
