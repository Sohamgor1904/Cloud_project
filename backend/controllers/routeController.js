/**
 * backend/controllers/routeController.js
 * Handles /api/route endpoints.
 */
const { generateRoute }  = require('../services/routeService');
const { predictOverflow } = require('../services/predictionService');
const { getAllBins }      = require('./binController');

// GET /api/route/today
async function getToday(req, res, next) {
  try {
    // Re-use bin controller logic by simulating its req/res
    const bins = await _fetchCurrentBins();
    const { route, stats } = generateRoute(bins);
    res.json({ route, stats });
  } catch (err) {
    next(err);
  }
}

// GET /api/route/predictions
async function getPredictions(req, res, next) {
  try {
    const bins = await _fetchCurrentBins();
    res.json(predictOverflow(bins));
  } catch (err) {
    next(err);
  }
}

// Internal helper — fetches current bins by calling getAllBins logic
function _fetchCurrentBins() {
  return new Promise((resolve, reject) => {
    const fakeres = {
      json: data => resolve(Array.isArray(data) ? data : data.bins || []),
    };
    const fakereq  = {};
    const fakenext = reject;
    getAllBins(fakereq, fakeres, fakenext);
  });
}

module.exports = { getToday, getPredictions };
