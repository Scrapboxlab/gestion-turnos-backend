const { query } = require('../config/database');

const findAll = async (businessId, { status, from, to } = {}) => {
  let sql = 'SELECT * FROM payments WHERE business_id = $1';
  const params = [businessId];
  let idx = 2;

  if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
  if (from) { sql += ` AND date >= $${idx++}`; params.push(from); }
  if (to) { sql += ` AND date <= $${idx++}`; params.push(to); }

  sql += ' ORDER BY date DESC, created_at DESC';
  const { rows } = await query(sql, params);
  return rows;
};

const findById = async (businessId, id) => {
  const { rows } = await query(
    'SELECT * FROM payments WHERE id = $1 AND business_id = $2',
    [id, businessId]
  );
  return rows[0] || null;
};

const create = async (businessId, data) => {
  const { rows } = await query(
    `INSERT INTO payments (business_id, appointment_id, client_name, service_name, amount, date, status, method)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      businessId,
      data.appointmentId || null,
      data.clientName,
      data.serviceName,
      data.amount,
      data.date || new Date().toISOString().split('T')[0],
      data.status || 'pending',
      data.method || null,
    ]
  );
  return rows[0];
};

const update = async (businessId, id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
  if (data.method !== undefined) { fields.push(`method = $${idx++}`); values.push(data.method); }

  if (!fields.length) return findById(businessId, id);
  fields.push('updated_at = NOW()');
  values.push(id, businessId);

  const { rows } = await query(
    `UPDATE payments SET ${fields.join(', ')} WHERE id = $${idx++} AND business_id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const getMonthlyRevenue = async (businessId) => {
  const { rows } = await query(
    `SELECT
       TO_CHAR(date, 'Mon') AS month,
       EXTRACT(MONTH FROM date) AS month_num,
       EXTRACT(YEAR FROM date) AS year,
       COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS revenue,
       COUNT(*) FILTER (WHERE status = 'paid') AS count
     FROM payments
     WHERE business_id = $1 AND date >= NOW() - INTERVAL '12 months'
     GROUP BY month, month_num, year
     ORDER BY year, month_num`,
    [businessId]
  );
  return rows;
};

const getSummary = async (businessId) => {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_paid,
       COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS total_pending,
       COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND date >= DATE_TRUNC('month', NOW())), 0) AS month_revenue
     FROM payments WHERE business_id = $1`,
    [businessId]
  );
  return rows[0];
};

module.exports = { findAll, findById, create, update, getMonthlyRevenue, getSummary };
