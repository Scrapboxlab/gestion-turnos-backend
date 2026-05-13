const router = require('express').Router();
const ctrl = require('../controllers/appointments.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createAppointmentSchema, updateAppointmentSchema } = require('../validations/appointments.validation');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createAppointmentSchema), ctrl.create);
router.put('/:id', validate(updateAppointmentSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
