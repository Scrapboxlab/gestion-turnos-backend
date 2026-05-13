const staffRepo = require('../repositories/staff.repository');
const AppError = require('../utils/AppError');

const formatStaff = (row) => ({
  id: row.id,
  name: row.name,
  role: row.role,
  workHours: {
    start: typeof row.work_hours_start === 'string' ? row.work_hours_start.slice(0, 5) : row.work_hours_start,
    end: typeof row.work_hours_end === 'string' ? row.work_hours_end.slice(0, 5) : row.work_hours_end,
  },
  daysOff: row.days_off || [],
  services: row.services || [],
  rating: parseFloat(row.rating || 0),
  appointments: row.appointments_count || 0,
  avatarUrl: row.avatar_url,
});

const getAll = async (businessId) => {
  const rows = await staffRepo.findAll(businessId);
  return rows.map(formatStaff);
};

const getById = async (businessId, id) => {
  const row = await staffRepo.findById(businessId, id);
  if (!row) throw new AppError('Profesional no encontrado', 404);
  return formatStaff(row);
};

const create = async (businessId, data) => {
  const row = await staffRepo.create(businessId, data);
  return formatStaff(row);
};

const update = async (businessId, id, data) => {
  await staffRepo.findById(businessId, id).then(r => {
    if (!r) throw new AppError('Profesional no encontrado', 404);
  });
  const row = await staffRepo.update(businessId, id, data);
  return formatStaff(row);
};

const remove = async (businessId, id) => {
  const result = await staffRepo.remove(businessId, id);
  if (!result) throw new AppError('Profesional no encontrado', 404);
};

module.exports = { getAll, getById, create, update, remove };
