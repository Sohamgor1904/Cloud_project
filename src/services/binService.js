/**
 * SmartWaste — services/binService.js
 * Member 2 — Backend Developer
 *
 * All bin-related DB operations + simulation logic.
 * Uses Member 3's schema and Member 4's calculatePriority().
 */
const pool = require('../db/pool');
const { calculatePriority } = require('./routeService');
const { generateAlerts }    = require('./alertEngine');

// ── IN-MEMORY FALLBACK (used when DB is unavailable) ─────────────────────
// This mirrors db/seed.sql so the app works without PostgreSQL during dev
const FALLBACK_BINS = [
  { id:1,  zone:'A', location:'Zone A – GIFT Tower Plaza',        lat:23.1685, lng:72.6835 },
  { id:2,  zone:'A', location:'Zone A – Financial Hub Entrance',  lat:23.1680, lng:72.6843 },
  { id:3,  zone:'A', location:'Zone A – Riverside Walk',          lat:23.1673, lng:72.6850 },
  { id:4,  zone:'A', location:'Zone A – Central Park East',       lat:23.1668, lng:72.6828 },
  { id:5,  zone:'A', location:'Zone A – Corporate Block 5',       lat:23.1678, lng:72.6820 },
  { id:6,  zone:'A', location:'Zone A – Heritage Walk',           lat:23.1663, lng:72.6832 },
  { id:7,  zone:'B', location:'Zone B – Sector 7 Residency',      lat:23.1645, lng:72.6840 },
  { id:8,  zone:'B', location:'Zone B – Garden Apartments',       lat:23.1638, lng:72.6833 },
  { id:9,  zone:'B', location:'Zone B – Metro Station North',     lat:23.1632, lng:72.6845 },
  { id:10, zone:'B', location:'Zone B – Community Hall',          lat:23.1648, lng:72.6855 },
  { id:11, zone:'B', location:'Zone B – School Road Junction',    lat:23.1625, lng:72.6852 },
  { id:12, zone:'B', location:'Zone B – Hospital Gate',           lat:23.1640, lng:72.6862 },
  { id:13, zone:'C', location:'Zone C – Market Square',           lat:23.1685, lng:72.6768 },
  { id:14, zone:'C', location:'Zone C – Food Court Area',         lat:23.1678, lng:72.6778 },
  { id:15, zone:'C', location:'Zone C – Shopping Arcade',         lat:23.1672, lng:72.6788 },
  { id:16, zone:'C', location:'Zone C – Civic Centre',            lat:23.1665, lng:72.6762 },
  { id:17, zone:'C', location:'Zone C – Weekend Bazaar',          lat:23.1682, lng:72.6755 },
  { id:18, zone:'D', location:'Zone D – Industrial Gate 1',       lat:23.1638, lng:72.6775 },
  { id:19, zone:'D', location:'Zone D – Logistics Hub',           lat:23.1628, lng:72.6762 },
  { id:20, zone:'D', location:'Zone D – Warehouse District',      lat:23.1618, lng:72.6770 },
  { id:21, zone:'D', location:'Zone D – Factory Row',             lat:23.1632, lng:72.6750 },
  { id:22, zone:'D', location:'Zone D – Export Terminal',         lat:23.1642, lng:72.6782 },
];

let memoryFillPct = Object.fromEntries(FALLBACK_BINS.map(b => [b.id, 0]));

// ── getAllBins ────────────────────────────────────────────────────────────
/**
 * Fetches all bins with their latest fill_pct and priority.
 * Uses the latest_bin_fills VIEW from Member 3's schema.
 * Falls back to in-memory data if DB is unavailable.
 */
async function getAllBins() {
  try {
    const { rows } = await pool.query('SELECT * FROM latest_bin_fills');
    return rows.map(r => ({
      id:       parseInt(r.id),
      location: r.location,
      zone:     r.zone,
      lat:      parseFloat(r.lat),
      lng:      parseFloat(r.lng),
      fill_pct: parseFloat(r.fill_pct),
      priority: parseFloat(r.priority),
    }));
  } catch (err) {
    console.warn('[binService] DB unavailable — using in-memory data:', err.message);
    return FALLBACK_BINS.map(b => ({
      ...b,
      fill_pct: memoryFillPct[b.id] || 0,
      priority: calculatePriority(memoryFillPct[b.id] || 0),
    }));
  }
}

// ── simulateBins ─────────────────────────────────────────────────────────
/**
 * Generates random fill levels for all bins and writes to DB.
 * Must write to DB so the route endpoint reads fresh data.
 * (In production: reads from real IoT sensors instead of Math.random.)
 *
 * @returns {{ bins: Array, alerts: Array }}
 */
async function simulateBins() {
  // Generate random fill levels
  const newFills = FALLBACK_BINS.map(bin => ({
    ...bin,
    fill_pct: parseFloat((Math.random() * 100).toFixed(2)),
  }));

  // Calculate priority for each bin (Member 4's function)
  const binsWithPriority = newFills.map(bin => ({
    ...bin,
    priority: calculatePriority(bin.fill_pct),
  }));

  // Try to write to PostgreSQL
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const bin of binsWithPriority) {
        await client.query(
          'INSERT INTO fill_history (bin_id, fill_pct, priority) VALUES ($1, $2, $3)',
          [bin.id, bin.fill_pct, bin.priority]
        );
      }
      await client.query('COMMIT');
      console.log('[binService] ✅ Simulation written to DB —', binsWithPriority.length, 'bins');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    // Fallback: keep in memory if DB is down
    console.warn('[binService] DB write failed — storing in memory:', err.message);
    binsWithPriority.forEach(b => { memoryFillPct[b.id] = b.fill_pct; });
  }

  // Generate alerts (Member 4's engine)
  const alerts = generateAlerts(binsWithPriority);

  return { bins: binsWithPriority, alerts };
}

module.exports = { getAllBins, simulateBins };
