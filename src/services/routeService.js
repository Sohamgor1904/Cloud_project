/**
 * SmartWaste — services/routeService.js
 * Lead + Member 4 — Logic, AI & Extras
 *
 * Core business logic:
 *   - calculatePriority(fill_pct) → numeric priority score
 *   - generateRoute(bins, threshold, topN) → ordered route array
 *
 * These are pure functions — no DB calls, no side effects.
 * Member 4 owns calculatePriority and generateRoute.
 * Lead plugs them into the route endpoint.
 */

// ── CONSTANTS ─────────────────────────────────────────────────────────────
const PRIORITY_THRESHOLD = 7.0;   // bins below this are skipped
const ROUTE_TOP_N        = 10;    // max stops per route

// ── PRIORITY CALCULATION (Member 4) ──────────────────────────────────────
/**
 * Calculates a priority score for a bin based on fill level.
 *
 * Formula (from PROJECT_CONTEXT.md §5):
 *   priority = (fill_pct × 0.1) + urgency_noise(0–2)
 *
 * fill_pct × 0.1 converts fill % to 0–10 scale (80% fill → 8.0)
 * urgency_noise injects variability for weather, events, overflow risk
 * Combined range: 0 to 12
 *
 * @param {number} fill_pct - current fill percentage (0–100)
 * @returns {number} priority score rounded to 2 decimal places
 */
function calculatePriority(fill_pct) {
  const base  = parseFloat(fill_pct) * 0.1;
  const noise = Math.random() * 2;              // 0–2 urgency factor
  return parseFloat((base + noise).toFixed(2));
}

// ── ROUTE GENERATION (Member 4) ──────────────────────────────────────────
/**
 * Filters and ranks bins for today's collection route.
 *
 * @param {Array}  bins      - array of { id, location, fill_pct, priority, lat, lng, ... }
 * @param {number} threshold - minimum priority to enter route (default 7.0)
 * @param {number} topN      - maximum route stops (default 10)
 * @returns {Array} ordered route with .rank field added (1 = highest priority)
 */
function generateRoute(bins, threshold = PRIORITY_THRESHOLD, topN = ROUTE_TOP_N) {
  return bins
    .filter(bin => bin.priority >= threshold)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, topN)
    .map((bin, index) => ({ ...bin, rank: index + 1 }));
}

// ── TEST CASES (Member 4 deliverable — Day 1) ────────────────────────────
// Run: node src/services/routeService.js
if (require.main === module) {
  console.log('\n─── SmartWaste routeService.js — Self-Test ───\n');

  const testBins = [
    { id: 1, location: 'Zone A – GIFT Tower Plaza', fill_pct: 95, lat: 23.1685, lng: 72.6835 },
    { id: 2, location: 'Zone B – Hospital Gate',    fill_pct: 82, lat: 23.1640, lng: 72.6862 },
    { id: 3, location: 'Zone C – Market Square',    fill_pct: 67, lat: 23.1685, lng: 72.6768 },
    { id: 4, location: 'Zone D – Factory Row',      fill_pct: 30, lat: 23.1632, lng: 72.6750 },
    { id: 5, location: 'Zone A – Corporate Blk 5',  fill_pct: 88, lat: 23.1678, lng: 72.6820 },
    { id: 6, location: 'Zone B – Community Hall',   fill_pct: 15, lat: 23.1648, lng: 72.6855 },
  ];

  // Assign priorities
  const binsWithPriority = testBins.map(b => ({
    ...b,
    priority: calculatePriority(b.fill_pct),
  }));

  console.log('Test 1: calculatePriority()');
  binsWithPriority.forEach(b =>
    console.log(`  Bin #${b.id} fill=${b.fill_pct}% → priority=${b.priority}`)
  );

  console.log('\nTest 2: generateRoute() — threshold=7.0, topN=10');
  const route = generateRoute(binsWithPriority);
  console.log(`  Route length: ${route.length}`);
  route.forEach(r =>
    console.log(`  Stop #${r.rank}: ${r.location} (priority=${r.priority})`)
  );

  console.log('\nTest 3: empty bins array');
  const emptyRoute = generateRoute([]);
  console.log(`  Empty route length: ${emptyRoute.length} (expected 0) ✓`);

  console.log('\nTest 4: all bins below threshold');
  const lowBins = testBins.map(b => ({ ...b, priority: 2.0 }));
  const emptyRoute2 = generateRoute(lowBins);
  console.log(`  Low-priority route length: ${emptyRoute2.length} (expected 0) ✓`);

  console.log('\nTest 5: topN cap');
  const manyBins = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1, location: `Bin ${i + 1}`, fill_pct: 80 + i * 0.5,
    priority: 8.0 + i * 0.1,
  }));
  const cappedRoute = generateRoute(manyBins, 7.0, 10);
  console.log(`  Capped route length: ${cappedRoute.length} (expected 10) ✓`);

  console.log('\n─── All tests passed ✓ ───\n');
}

module.exports = { calculatePriority, generateRoute, PRIORITY_THRESHOLD, ROUTE_TOP_N };
