const router = require('express').Router();
const { getStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', getStats);

module.exports = router;
