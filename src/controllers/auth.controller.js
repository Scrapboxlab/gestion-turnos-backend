const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ status: 'success', data: result });
});

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ status: 'success', data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      businessId: req.user.business_id,
    },
  });
});

module.exports = { login, register, me };
