const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/clients', require('./clients.routes'));
router.use('/services', require('./services.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/appointments', require('./appointments.routes'));
router.use('/payments', require('./payments.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/booking', require('./booking.routes'));

module.exports = router;
