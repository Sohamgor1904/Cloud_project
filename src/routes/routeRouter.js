/**
 * SmartWaste — routes/routeRouter.js
 * Lead — System Lead + Integration Owner
 *
 * Routes:
 *   GET /api/route/today → today's optimized collection route
 */
const express      = require('express');
const router       = express.Router();
const binService   = require('../services/binService');
const { generateRoute } = require('../services/routeService');
const { predictOverflow } = require('../services/predictionService');

// GET /api/route/today
// Returns: [{ id, location, zone, lat, lng, fill_pct, priority, rank }]
router.get('/today', async (req, res, next) => {
  try {
    const bins  = await binService.getAllBins();
    const route = generateRoute(bins);

    // Optionally attach predictions (Member 4 extra)
    res.json(route);
  } catch (err) {
    next(err);
  }
});

// GET /api/route/predictions — Member 4 bonus endpoint
router.get('/predictions', async (req, res, next) => {
  try {
    const bins        = await binService.getAllBins();
    const predictions = predictOverflow(bins);
    res.json(predictions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
