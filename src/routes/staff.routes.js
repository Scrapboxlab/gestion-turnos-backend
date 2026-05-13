const router = require('express').Router();
const ctrl = require('../controllers/staff.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createStaffSchema, updateStaffSchema } = require('../validations/staff.validation');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createStaffSchema), ctrl.create);
router.put('/:id', validate(updateStaffSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
