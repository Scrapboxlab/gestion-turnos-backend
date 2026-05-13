const asyncHandler = require('../utils/asyncHandler');
const servicesService = require('../services/services.service');

const getAll = asyncHandler(async (req, res) => {
  const data = await servicesService.getAll(req.businessId, { active: req.query.active });
  res.json({ status: 'success', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await servicesService.getById(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await servicesService.create(req.businessId, req.body);
  res.status(201).json({ status: 'success', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await servicesService.update(req.businessId, parseInt(req.params.id), req.body);
  res.json({ status: 'success', data });
});

const remove = asyncHandler(async (req, res) => {
  await servicesService.remove(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', message: 'Servicio eliminado' });
});

module.exports = { getAll, getById, create, update, remove };
