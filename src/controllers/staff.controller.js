const asyncHandler = require('../utils/asyncHandler');
const staffService = require('../services/staff.service');

const getAll = asyncHandler(async (req, res) => {
  const data = await staffService.getAll(req.businessId);
  res.json({ status: 'success', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await staffService.getById(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await staffService.create(req.businessId, req.body);
  res.status(201).json({ status: 'success', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await staffService.update(req.businessId, parseInt(req.params.id), req.body);
  res.json({ status: 'success', data });
});

const remove = asyncHandler(async (req, res) => {
  await staffService.remove(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', message: 'Profesional eliminado' });
});

module.exports = { getAll, getById, create, update, remove };
