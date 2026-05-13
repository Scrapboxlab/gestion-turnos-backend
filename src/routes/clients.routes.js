const router = require('express').Router();
const ctrl = require('../controllers/clients.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createClientSchema, updateClientSchema } = require('../validations/clients.validation');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createClientSchema), ctrl.create);
router.put('/:id', validate(updateClientSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
