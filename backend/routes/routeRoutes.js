/**
 * backend/routes/routeRoutes.js
 * GET /api/route/today
 * GET /api/route/predictions
 */
const router          = require('express').Router();
const routeController = require('../controllers/routeController');

router.get('/today',       routeController.getToday);
router.get('/predictions', routeController.getPredictions);

module.exports = router;
