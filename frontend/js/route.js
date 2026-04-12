/**
 * frontend/js/route.js
 * Greedy nearest-neighbour route optimisation algorithm.
 * Runs entirely in the browser — no API needed.
 *
 * Imported by dashboard.js via <script> tag before dashboard.js.
 */

const DEPOT       = { lat: 23.1648, lng: 72.6800 };
const FILL_WEIGHT = 0.60;
const DIST_WEIGHT = 0.40;

/** Haversine great-circle distance in km */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Greedy route optimisation.
 * Score = FILL_WEIGHT × normFill − DIST_WEIGHT × normDist
 * @param {Array} candidates  bins already filtered by priority
 * @returns {Array} ordered route with .rank added
 */
function greedyOptimizeRoute(candidates) {
  if (!candidates.length) return [];
  let curLat = DEPOT.lat, curLng = DEPOT.lng;
  const unvisited = [...candidates], ordered = [];

  while (unvisited.length) {
    const dists   = unvisited.map(b => haversineKm(curLat, curLng, b.lat, b.lng));
    const maxDist = Math.max(...dists) || 1;
    const fills   = unvisited.map(b => b.fill_pct);
    const maxFill = Math.max(...fills), minFill = Math.min(...fills);
    const span    = maxFill - minFill || 1;
    let best = -Infinity, bestIdx = 0;
    unvisited.forEach((b, i) => {
      const score = FILL_WEIGHT * (b.fill_pct - minFill) / span - DIST_WEIGHT * dists[i] / maxDist;
      if (score > best) { best = score; bestIdx = i; }
    });
    const chosen = unvisited.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    curLat = chosen.lat; curLng = chosen.lng;
  }
  return ordered.map((b, i) => ({ ...b, rank: i + 1 }));
}
