const asyncHandler = require('../utils/asyncHandler');
const appointmentsService = require('../services/appointments.service');

const getAll = asyncHandler(async (req, res) => {
  const { date, status, staffId, clientId, from, to } = req.query;
  const data = await appointmentsService.getAll(req.businessId, {
    date, status,
    staffId: staffId ? parseInt(staffId) : undefined,
    clientId: clientId ? parseInt(clientId) : undefined,
    from, to,
  });
  res.json({ status: 'success', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await appointmentsService.getById(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await appointmentsService.create(req.businessId, req.body);
  res.status(201).json({ status: 'success', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await appointmentsService.update(req.businessId, parseInt(req.params.id), req.body);
  res.json({ status: 'success', data });
});

const remove = asyncHandler(async (req, res) => {
  await appointmentsService.remove(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', message: 'Turno eliminado' });
});

module.exports = { getAll, getById, create, update, remove };
