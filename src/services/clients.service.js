const clientsRepo = require('../repositories/clients.repository');
const AppError = require('../utils/AppError');

const formatClient = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  tags: row.tags || [],
  notes: row.notes,
  totalSpent: parseFloat(row.total_spent || 0),
  visits: row.visits || 0,
  lastVisit: row.last_visit instanceof Date ? row.last_visit.toISOString().split('T')[0] : row.last_visit,
  createdAt: row.created_at,
});

const getAll = async (businessId, filters) => {
  const rows = await clientsRepo.findAll(businessId, filters);
  return rows.map(formatClient);
};

const getById = async (businessId, id) => {
  const row = await clientsRepo.findById(businessId, id);
  if (!row) throw new AppError('Cliente no encontrado', 404);
  return formatClient(row);
};

const create = async (businessId, data) => {
  const row = await clientsRepo.create(businessId, data);
  return formatClient(row);
};

const update = async (businessId, id, data) => {
  const row = await clientsRepo.update(businessId, id, data);
  if (!row) throw new AppError('Cliente no encontrado', 404);
  return formatClient(row);
};

const remove = async (businessId, id) => {
  const result = await clientsRepo.remove(businessId, id);
  if (!result) throw new AppError('Cliente no encontrado', 404);
};

module.exports = { getAll, getById, create, update, remove };
