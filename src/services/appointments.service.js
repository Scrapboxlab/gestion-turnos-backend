const appointmentsRepo = require('../repositories/appointments.repository');
const servicesRepo = require('../repositories/services.repository');
const staffRepo = require('../repositories/staff.repository');
const notificationsRepo = require('../repositories/notifications.repository');
const AppError = require('../utils/AppError');

const formatAppointment = (row) => ({
  id: row.id,
  clientId: row.client_id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  clientEmail: row.client_email,
  staffId: row.staff_id,
  staffName: row.staff_name,
  serviceId: row.service_id,
  serviceName: row.service_name,
  date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
  time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
  duration: row.duration,
  price: parseFloat(row.price),
  status: row.status,
  notes: row.notes,
  color: row.color,
  createdAt: row.created_at,
});

const getAll = async (businessId, filters) => {
  const rows = await appointmentsRepo.findAll(businessId, filters);
  return rows.map(formatAppointment);
};

const getById = async (businessId, id) => {
  const row = await appointmentsRepo.findById(businessId, id);
  if (!row) throw new AppError('Turno no encontrado', 404);
  return formatAppointment(row);
};

const create = async (businessId, data) => {
  const service = await servicesRepo.findById(businessId, data.serviceId);
  if (!service) throw new AppError('Servicio no encontrado', 404);
  if (!service.active) throw new AppError('El servicio está inactivo', 400);

  const staffMember = await staffRepo.findById(businessId, data.staffId);
  if (!staffMember) throw new AppError('Profesional no encontrado', 404);

  const row = await appointmentsRepo.create(businessId, {
    ...data,
    serviceName: service.name,
    staffName: staffMember.name,
    price: service.price,
    duration: data.duration || service.duration,
    color: service.color,
  });

  await notificationsRepo.create(businessId, {
    type: 'booking',
    title: 'Nuevo turno',
    message: `${data.clientName} reservó ${service.name} para el ${data.date} ${data.time}`,
  });

  return formatAppointment(row);
};

const update = async (businessId, id, data) => {
  const existing = await appointmentsRepo.findById(businessId, id);
  if (!existing) throw new AppError('Turno no encontrado', 404);

  if (data.status === 'cancelled' && existing.status !== 'cancelled') {
    await notificationsRepo.create(businessId, {
      type: 'cancellation',
      title: 'Turno cancelado',
      message: `El turno de ${existing.client_name} del ${existing.date} fue cancelado`,
    });
  }

  const row = await appointmentsRepo.update(businessId, id, data);
  if (!row) throw new AppError('Turno no encontrado', 404);
  return formatAppointment(row);
};

const remove = async (businessId, id) => {
  const result = await appointmentsRepo.remove(businessId, id);
  if (!result) throw new AppError('Turno no encontrado', 404);
};

module.exports = { getAll, getById, create, update, remove };
