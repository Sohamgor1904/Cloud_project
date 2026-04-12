/**
 * backend/routes/binRoutes.js
 * GET  /api/bins
 * POST /api/bins/simulate
 */
const router        = require('express').Router();
const binController = require('../controllers/binController');

router.get('/',         binController.getAllBins);
router.post('/simulate', binController.simulate);

module.exports = router;
