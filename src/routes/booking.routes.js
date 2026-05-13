const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');

// Public routes - no authentication required
router.get('/:businessId/services', ctrl.getServices);
router.get('/:businessId/staff', ctrl.getStaff);
router.get('/:businessId/availability', ctrl.getAvailability);
router.post('/:businessId', ctrl.createBooking);

module.exports = router;
