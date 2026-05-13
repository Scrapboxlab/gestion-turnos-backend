const paymentsRepo = require('../repositories/payments.repository');
const notificationsRepo = require('../repositories/notifications.repository');
const AppError = require('../utils/AppError');

const formatPayment = (row) => ({
  id: row.id,
  appointmentId: row.appointment_id,
  clientName: row.client_name,
  service: row.service_name,
  amount: parseFloat(row.amount),
  date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
  status: row.status,
  method: row.method,
  createdAt: row.created_at,
});

const getAll = async (businessId, filters) => {
  const rows = await paymentsRepo.findAll(businessId, filters);
  return rows.map(formatPayment);
};

const create = async (businessId, data) => {
  const row = await paymentsRepo.create(businessId, data);
  if (data.status === 'paid') {
    await notificationsRepo.create(businessId, {
      type: 'payment',
      title: 'Pago recibido',
      message: `${data.clientName} pagó $${data.amount} por ${data.serviceName}`,
    });
  }
  return formatPayment(row);
};

const update = async (businessId, id, data) => {
  const existing = await paymentsRepo.findById(businessId, id);
  if (!existing) throw new AppError('Pago no encontrado', 404);

  const row = await paymentsRepo.update(businessId, id, data);

  if (data.status === 'paid' && existing.status !== 'paid') {
    await notificationsRepo.create(businessId, {
      type: 'payment',
      title: 'Pago recibido',
      message: `${existing.client_name} pagó $${existing.amount} por ${existing.service_name}`,
    });
  }

  return formatPayment(row);
};

const getSummary = async (businessId) => {
  const [summary, monthly] = await Promise.all([
    paymentsRepo.getSummary(businessId),
    paymentsRepo.getMonthlyRevenue(businessId),
  ]);

  return {
    totalPaid: parseFloat(summary.total_paid),
    totalPending: parseFloat(summary.total_pending),
    monthRevenue: parseFloat(summary.month_revenue),
    monthly: monthly.map(m => ({
      month: m.month,
      revenue: parseFloat(m.revenue),
      count: parseInt(m.count),
    })),
  };
};

module.exports = { getAll, create, update, getSummary };
