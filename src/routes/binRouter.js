/**
 * SmartWaste — routes/binRouter.js
 * Member 2 — Backend Developer
 *
 * Routes:
 *   GET  /api/bins          → all bins with latest fill + priority
 *   POST /api/bins/simulate → generate new fill data, write to DB
 */
const express    = require('express');
const router     = express.Router();
const binService = require('../services/binService');

// GET /api/bins
// Returns: [{ id, location, zone, lat, lng, fill_pct, priority }]
router.get('/', async (req, res, next) => {
  try {
    const bins = await binService.getAllBins();
    res.json(bins);
  } catch (err) {
    next(err);
  }
});

// POST /api/bins/simulate
// Returns: { message, bins: [...], alerts: [...] }
router.post('/simulate', async (req, res, next) => {
  try {
    const result = await binService.simulateBins();
    res.json({ message: 'ok', ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
