const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateBusinessSchema, updateHoursSchema, updateBookingRulesSchema } = require('../validations/settings.validation');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.put('/business', validate(updateBusinessSchema), ctrl.updateBusiness);
router.put('/hours', validate(updateHoursSchema), ctrl.updateHours);
router.put('/booking', validate(updateBookingRulesSchema), ctrl.updateBookingRules);

module.exports = router;
