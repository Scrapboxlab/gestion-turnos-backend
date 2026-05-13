const { query } = require('../config/database');
const appointmentsRepo = require('../repositories/appointments.repository');
const notificationsRepo = require('../repositories/notifications.repository');

const getStats = async (businessId) => {
  const today = new Date().toISOString().split('T')[0];

  const [todayStats, todayAppts, recentNotifs, monthStats] = await Promise.all([
    appointmentsRepo.getTodayStats(businessId, today),
    appointmentsRepo.findAll(businessId, { date: today }),
    notificationsRepo.findAll(businessId, {}),
    query(`
      SELECT
        COUNT(DISTINCT client_id) FILTER (WHERE date >= DATE_TRUNC('month', NOW())) AS new_clients_month,
        COUNT(*) FILTER (WHERE date >= DATE_TRUNC('month', NOW()) AND deleted_at IS NULL) AS appointments_month,
        COALESCE(SUM(price) FILTER (WHERE status IN ('confirmed','completed') AND date = $1 AND deleted_at IS NULL), 0) AS revenue_today
      FROM appointments
      WHERE business_id = $2 AND deleted_at IS NULL
    `, [today, businessId]),
  ]);

  const revenueQuery = await query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'Mon') AS month,
      EXTRACT(MONTH FROM date) AS month_num,
      EXTRACT(YEAR FROM date) AS year_num,
      COALESCE(SUM(price) FILTER (WHERE status IN ('confirmed','completed')), 0) AS revenue,
      COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) AS appointments
    FROM appointments
    WHERE business_id = $1 AND deleted_at IS NULL AND date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', date), month, month_num, year_num
    ORDER BY year_num, month_num
  `, [businessId]);

  const formatAppt = (row) => ({
    id: row.id,
    clientName: row.client_name,
    serviceName: row.service_name,
    staffName: row.staff_name,
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
    time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
    duration: row.duration,
    price: parseFloat(row.price),
    status: row.status,
    notes: row.notes,
    color: row.color,
  });

  return {
    today: {
      total: parseInt(todayStats.total || 0),
      confirmed: parseInt(todayStats.confirmed || 0),
      pending: parseInt(todayStats.pending || 0),
      cancelled: parseInt(todayStats.cancelled || 0),
      completed: parseInt(todayStats.completed || 0),
      revenue: parseFloat(todayStats.revenue || 0),
    },
    month: {
      appointments: parseInt(monthStats.rows[0]?.appointments_month || 0),
      newClients: parseInt(monthStats.rows[0]?.new_clients_month || 0),
    },
    todayAppointments: todayAppts.map(formatAppt),
    revenueData: revenueQuery.rows.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      appointments: parseInt(r.appointments),
    })),
    recentNotifications: recentNotifs.slice(0, 5).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      time: n.created_at,
    })),
  };
};

module.exports = { getStats };
