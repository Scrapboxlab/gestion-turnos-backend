const asyncHandler = require('../utils/asyncHandler');
const paymentsService = require('../services/payments.service');

const getAll = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const data = await paymentsService.getAll(req.businessId, { status, from, to });
  res.json({ status: 'success', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await paymentsService.create(req.businessId, req.body);
  res.status(201).json({ status: 'success', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await paymentsService.update(req.businessId, parseInt(req.params.id), req.body);
  res.json({ status: 'success', data });
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await paymentsService.getSummary(req.businessId);
  res.json({ status: 'success', data });
});

module.exports = { getAll, create, update, getSummary };
