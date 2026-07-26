const express = require('express');
const router = express.Router();
const { getOverview, getTrends } = require('../controllers/stats');

router.get('/overview', getOverview);
router.get('/trends', getTrends);

module.exports = router;
