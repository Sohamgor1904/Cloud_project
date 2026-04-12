/**
 * frontend/js/route.js
 * Smart Route Algorithm — Nearest Critical-First across ALL Zones
 *
 * LOGIC (2-method mix as required):
 *   Method 1 — "Only filled/red-flagged bins"
 *     → Only bins with fill_pct >= RED_THRESHOLD (75%) MUST be emptied.
 *     → WARNING bins (55-74%) added as secondary candidates if any critical ones exist.
 *   Method 2 — "Shortest bin first" (Nearest-Neighbor)
 *     → Starting from depot, always go to the NEAREST unvisited critical bin.
 *     → Pure Haversine distance — no zone restriction, spans entire city.
 *
 * Combined: All critical red bins → ordered by nearest distance from last stop.
 */

const DEPOT           = { lat: 23.1648, lng: 72.6800 };  // GIFT City main depot
const RED_THRESHOLD   = 75;   // % — must empty (CRITICAL)
const WARN_THRESHOLD  = 55;   // % — secondary candidates (WARNING)
const MAX_ROUTE_STOPS = 15;   // safety cap

/**
 * Haversine great-circle distance in km between two GPS points.
 * Used for real physical shortest-path calculation.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Pure nearest-neighbor traversal.
 * At each step: pick the unvisited bin CLOSEST to the current truck position.
 * No zone filter — works across the entire GIFT City.
 *
 * @param {Array} candidates — all bins to visit (already filtered)
 * @returns {Array} — ordered route with .rank, .distance_km, .cumulative_km added
 */
function nearestNeighborRoute(candidates) {
  if (!candidates.length) return [];

  let curLat = DEPOT.lat;
  let curLng = DEPOT.lng;
  const unvisited = [...candidates];
  const ordered   = [];
  let cumulative  = 0;

  while (unvisited.length) {
    // Find the nearest unvisited bin by real distance
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

  // Add rank + return-to-depot distance for last stop
  const depotReturn = haversineKm(
    ordered[ordered.length - 1].lat,
    ordered[ordered.length - 1].lng,
    DEPOT.lat, DEPOT.lng
  );

  return ordered.map((b, i) => ({ ...b, rank: i + 1 }));
}

/**
 * Main route generation — called by dashboard.js after simulation.
 *
 * Steps:
 *  1. Separate bins into CRITICAL (≥75%) and WARNING (55-74%)
 *  2. If no critical bins, WARNING bins enter as fallback
 *  3. Nearest-neighbor over critical bins, across ALL zones, entire city
 *
 * @param {Array} bins — all 22 bins with fill_pct
 * @returns {object} { route, stats }
 */
function buildRoute(bins) {
  // ── Step 1: Classify ───────────────────────────────────────────────────
  const critical = bins.filter(b => b.fill_pct >= RED_THRESHOLD);
  const warning  = bins.filter(b => b.fill_pct >= WARN_THRESHOLD && b.fill_pct < RED_THRESHOLD);
  const normal   = bins.filter(b => b.fill_pct < WARN_THRESHOLD);

  // ── Step 2: Build candidate pool ──────────────────────────────────────
  let candidates;
  if (critical.length > 0) {
    // Always take ALL critical bins + warning bins if under cap
    const remaining = MAX_ROUTE_STOPS - critical.length;
    const extras    = remaining > 0 ? warning.slice(0, remaining) : [];
    candidates      = [...critical, ...extras];
  } else if (warning.length > 0) {
    // Fallback: no critical, take warning bins
    candidates = warning.slice(0, MAX_ROUTE_STOPS);
  } else {
    candidates = [];
  }

  // ── Step 3: Nearest-neighbor ordering (entire city, no zone filter) ────
  const route = nearestNeighborRoute(candidates).slice(0, MAX_ROUTE_STOPS);

  // ── Step 4: Stats for dashboard ───────────────────────────────────────
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

// ── Backwards-compatible wrapper ──────────────────────────────────────────
// dashboard.js calls greedyOptimizeRoute(candidates) — keep this working
function greedyOptimizeRoute(candidates) {
  return nearestNeighborRoute(candidates);
}
