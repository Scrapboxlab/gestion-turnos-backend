const servicesRepo = require('../repositories/services.repository');
const AppError = require('../utils/AppError');

const formatService = (row) => ({
  id: row.id,
  name: row.name,
  duration: row.duration,
  price: parseFloat(row.price),
  category: row.category,
  color: row.color,
  active: row.active,
  createdAt: row.created_at,
});

const getAll = async (businessId, { active } = {}) => {
  const rows = await servicesRepo.findAll(businessId, { activeOnly: active === 'true' || active === true });
  return rows.map(formatService);
};

const getById = async (businessId, id) => {
  const row = await servicesRepo.findById(businessId, id);
  if (!row) throw new AppError('Servicio no encontrado', 404);
  return formatService(row);
};

const create = async (businessId, data) => {
  const row = await servicesRepo.create(businessId, data);
  return formatService(row);
};

const update = async (businessId, id, data) => {
  const row = await servicesRepo.update(businessId, id, data);
  if (!row) throw new AppError('Servicio no encontrado', 404);
  return formatService(row);
};

const remove = async (businessId, id) => {
  const result = await servicesRepo.remove(businessId, id);
  if (!result) throw new AppError('Servicio no encontrado', 404);
};

module.exports = { getAll, getById, create, update, remove };
