const router = require('express').Router();
const ctrl = require('../controllers/services.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createServiceSchema, updateServiceSchema } = require('../validations/services.validation');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createServiceSchema), ctrl.create);
router.put('/:id', validate(updateServiceSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
