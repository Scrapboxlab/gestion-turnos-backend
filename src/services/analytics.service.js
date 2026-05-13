const { query } = require('../config/database');

const getAnalytics = async (businessId) => {
  const [revenue, serviceStats, weeklyData, staffPerf, retention, totals] = await Promise.all([
    // Monthly revenue
    query(`
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
    `, [businessId]),

    // Service stats
    query(`
      SELECT
        s.name, s.color,
        COUNT(a.id) AS count,
        COALESCE(SUM(a.price), 0) AS revenue
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.business_id = $1 AND a.deleted_at IS NULL AND a.status NOT IN ('cancelled')
      GROUP BY s.id, s.name, s.color
      ORDER BY count DESC
      LIMIT 10
    `, [businessId]),

    // Weekly pattern (avg appointments by day of week)
    query(`
      SELECT
        EXTRACT(DOW FROM date) AS dow,
        TO_CHAR(date, 'Dy') AS day_name,
        COUNT(*) AS count
      FROM appointments
      WHERE business_id = $1 AND deleted_at IS NULL AND status NOT IN ('cancelled')
        AND date >= NOW() - INTERVAL '8 weeks'
      GROUP BY dow, day_name
      ORDER BY dow
    `, [businessId]),

    // Staff performance
    query(`
      SELECT
        st.id, st.name, st.role, st.rating,
        COUNT(a.id) AS appointments_count
      FROM staff st
      LEFT JOIN appointments a ON a.staff_id = st.id AND a.deleted_at IS NULL AND a.status NOT IN ('cancelled')
      WHERE st.business_id = $1 AND st.deleted_at IS NULL
      GROUP BY st.id, st.name, st.role, st.rating
      ORDER BY appointments_count DESC
    `, [businessId]),

    // Client retention (new vs returning per month)
    query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', a.date), 'Mon') AS month,
        EXTRACT(MONTH FROM a.date) AS month_num,
        COUNT(DISTINCT a.client_id) FILTER (WHERE a.client_id IS NOT NULL AND fc.first_appt >= DATE_TRUNC('month', a.date) AND fc.first_appt < DATE_TRUNC('month', a.date) + INTERVAL '1 month') AS nuevos,
        COUNT(DISTINCT a.client_id) FILTER (WHERE a.client_id IS NOT NULL AND fc.first_appt < DATE_TRUNC('month', a.date)) AS recurrentes
      FROM appointments a
      LEFT JOIN (
        SELECT client_id, MIN(date) AS first_appt FROM appointments
        WHERE business_id = $1 AND deleted_at IS NULL AND client_id IS NOT NULL
        GROUP BY client_id
      ) fc ON fc.client_id = a.client_id
      WHERE a.business_id = $1 AND a.deleted_at IS NULL AND a.date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', a.date), month, month_num
      ORDER BY DATE_TRUNC('month', a.date)
    `, [businessId]),

    // Totals
    query(`
      SELECT
        COUNT(DISTINCT CASE WHEN deleted_at IS NULL THEN id END) AS total_clients
      FROM clients WHERE business_id = $1
    `, [businessId]),
  ]);

  const dayNames = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

  return {
    revenueData: revenue.rows.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      appointments: parseInt(r.appointments),
    })),
    serviceStats: serviceStats.rows.map(r => ({
      name: r.name,
      color: r.color,
      count: parseInt(r.count),
      revenue: parseFloat(r.revenue),
    })),
    weeklyData: weeklyData.rows.map(r => ({
      day: dayNames[parseInt(r.dow)] || r.day_name,
      count: parseInt(r.count),
    })),
    staffPerformance: staffPerf.rows.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      rating: parseFloat(r.rating || 0),
      appointments: parseInt(r.appointments_count),
    })),
    retentionData: retention.rows.map(r => ({
      month: r.month,
      nuevos: parseInt(r.nuevos || 0),
      recurrentes: parseInt(r.recurrentes || 0),
    })),
    totals: {
      clients: parseInt(totals.rows[0]?.total_clients || 0),
    },
  };
};

module.exports = { getAnalytics };
