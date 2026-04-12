/**
 * backend/controllers/binController.js
 * Handles /api/bins endpoints.
 *
 * In-memory state: keeps latest simulated bin data.
 * Writes to PostgreSQL when DB is available; falls back to memory.
 */
const path = require('path');
const { simulateBins }  = require('../services/simulationService');
const { generateAlerts } = require('../services/alertService');

// Load master bin list from data/bins.json
const MASTER_BINS = require(path.join(__dirname, '../../data/bins.json'));

// In-memory current state (initialised with fill=0)
let currentBins = MASTER_BINS.map(b => ({ ...b, fill_pct: 0, priority: 0, simulated_at: null }));

// Try PostgreSQL (optional — degrades gracefully)
let pool = null;
try {
  pool = require('../config/db');
} catch (_) {
  console.warn('[binController] No DB config found — using in-memory state.');
}

// GET /api/bins
async function getAllBins(req, res, next) {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM latest_bin_fills ORDER BY id');
      return res.json(rows.map(r => ({
        id: parseInt(r.id), zone: r.zone, location: r.location,
        lat: parseFloat(r.lat), lng: parseFloat(r.lng),
        fill_pct: parseFloat(r.fill_pct), priority: parseFloat(r.priority),
      })));
    }
    res.json(currentBins);
  } catch (err) {
    next(err);
  }
}

// POST /api/bins/simulate
async function simulate(req, res, next) {
  try {
    const simulated = simulateBins(MASTER_BINS);

    // Try to persist to PostgreSQL
    if (pool) {
      try {
        const client = await pool.connect();
        await client.query('BEGIN');
        for (const b of simulated) {
          await client.query(
            'INSERT INTO fill_history (bin_id, fill_pct, priority) VALUES ($1, $2, $3)',
            [b.id, b.fill_pct, b.priority]
          );
        }
        await client.query('COMMIT');
        client.release();
      } catch (dbErr) {
        console.warn('[binController] DB write failed, using memory:', dbErr.message);
        currentBins = simulated;
      }
    } else {
      currentBins = simulated;
    }

    const alerts = generateAlerts(simulated);
    res.json({ message: 'ok', bins: simulated, alerts });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllBins, simulate };
