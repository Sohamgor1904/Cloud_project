/**
 * backend/services/routeService.js
 * Member 4 – Route generation algorithm
 * Filters candidates by critical threshold (≥75%), orders by nearest-neighbour.
 */

const RED_THRESHOLD   = 75;  // % (Critical)
const WARN_THRESHOLD  = 55;  // % (Warning)
const ROUTE_TOP_N     = 15;  // safety cap
const DEPOT           = { lat: 23.1648, lng: 72.6800 };  // GIFT City main depot

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
 * Pure nearest-neighbor traversal.
 * At each step: pick the unvisited bin CLOSEST to current position.
 * No zone filter — works across the entire GIFT City.
 */
function nearestNeighborRoute(candidates) {
  if (!candidates.length) return [];

  let curLat = DEPOT.lat;
  let curLng = DEPOT.lng;
  const unvisited = [...candidates];
  const ordered   = [];
  let cumulative  = 0;

  while (unvisited.length > 0) {
    let bestIdx  = 0;
    let bestDist = Infinity;

    unvisited.forEach((bin, i) => {
      const d = haversineKm(curLat, curLng, bin.lat, bin.lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });

    const chosen   = unvisited.splice(bestIdx, 1)[0];
    cumulative    += bestDist;

    ordered.push({
      ...chosen,
      distance_from_prev_km: parseFloat(bestDist.toFixed(3)),
      cumulative_km:          parseFloat(cumulative.toFixed(3)),
    });

    curLat = chosen.lat;
    curLng = chosen.lng;
  }

  return ordered.map((b, i) => ({ ...b, rank: i + 1 }));
}

/**
 * Full route generation:
 *   1. Separate bins into CRITICAL (≥75%) and WARNING (55-74%)
 *   2. If no critical bins, WARNING bins enter as fallback.
 *   3. Nearest-neighbor over candidates, across ALL zones.
 *
 * @param {Array} bins  bins with fill_pct
 * @returns {object} { route, stats }
 */
function generateRoute(bins, topN = ROUTE_TOP_N) {
  const critical = bins.filter(b => b.fill_pct >= RED_THRESHOLD);
  const warning  = bins.filter(b => b.fill_pct >= WARN_THRESHOLD && b.fill_pct < RED_THRESHOLD);
  const normal   = bins.filter(b => b.fill_pct < WARN_THRESHOLD);

  let candidates;
  if (critical.length > 0) {
    const remaining = topN - critical.length;
    const extras    = remaining > 0 ? warning.slice(0, remaining) : [];
    candidates      = [...critical, ...extras];
  } else if (warning.length > 0) {
    candidates = warning.slice(0, topN);
  } else {
    candidates = [];
  }

  const route = nearestNeighborRoute(candidates).slice(0, topN);
  
  const stats = {
    total_bins:      bins.length,
    critical_count:  critical.length,
    warning_count:   warning.length,
    normal_count:    normal.length,
    route_stops:     route.length,
    zones_covered:   [...new Set(route.map(b => b.zone))].sort().join(', '),
    total_distance:  route.length
      ? parseFloat((route[route.length - 1].cumulative_km + haversineKm(
          route[route.length - 1].lat, route[route.length - 1].lng, DEPOT.lat, DEPOT.lng
        )).toFixed(2))
      : 0,
  };

  return { route, stats };
}

module.exports = { generateRoute, haversineKm, RED_THRESHOLD, ROUTE_TOP_N };
