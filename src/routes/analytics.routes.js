const router = require('express').Router();
const { getAnalytics } = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', getAnalytics);

module.exports = router;
