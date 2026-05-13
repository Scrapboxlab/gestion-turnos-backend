const router = require('express').Router();
const ctrl = require('../controllers/payments.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createPaymentSchema, updatePaymentSchema } = require('../validations/payments.validation');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.post('/', validate(createPaymentSchema), ctrl.create);
router.put('/:id', validate(updatePaymentSchema), ctrl.update);

module.exports = router;
