const asyncHandler = require('../utils/asyncHandler');
const clientsService = require('../services/clients.service');

const getAll = asyncHandler(async (req, res) => {
  const { search, tag } = req.query;
  const data = await clientsService.getAll(req.businessId, { search, tag });
  res.json({ status: 'success', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await clientsService.getById(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await clientsService.create(req.businessId, req.body);
  res.status(201).json({ status: 'success', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await clientsService.update(req.businessId, parseInt(req.params.id), req.body);
  res.json({ status: 'success', data });
});

const remove = asyncHandler(async (req, res) => {
  await clientsService.remove(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', message: 'Cliente eliminado' });
});

module.exports = { getAll, getById, create, update, remove };
