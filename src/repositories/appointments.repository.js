const { query } = require('../config/database');

const findAll = async (businessId, { date, status, staffId, clientId, from, to } = {}) => {
  let sql = 'SELECT * FROM appointments WHERE business_id = $1 AND deleted_at IS NULL';
  const params = [businessId];
  let idx = 2;

  if (date) { sql += ` AND date = $${idx++}`; params.push(date); }
  if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
  if (staffId) { sql += ` AND staff_id = $${idx++}`; params.push(staffId); }
  if (clientId) { sql += ` AND client_id = $${idx++}`; params.push(clientId); }
  if (from) { sql += ` AND date >= $${idx++}`; params.push(from); }
  if (to) { sql += ` AND date <= $${idx++}`; params.push(to); }

  sql += ' ORDER BY date ASC, time ASC';
  const { rows } = await query(sql, params);
  return rows;
};

const findById = async (businessId, id) => {
  const { rows } = await query(
    'SELECT * FROM appointments WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
    [id, businessId]
  );
  return rows[0] || null;
};

const create = async (businessId, data) => {
  const { rows } = await query(
    `INSERT INTO appointments
       (business_id, client_id, client_name, client_phone, client_email, staff_id, staff_name, service_id, service_name, date, time, duration, price, status, notes, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      businessId,
      data.clientId || null,
      data.clientName,
      data.clientPhone || null,
      data.clientEmail || null,
      data.staffId,
      data.staffName,
      data.serviceId,
      data.serviceName,
      data.date,
      data.time,
      data.duration,
      data.price,
      data.status || 'pending',
      data.notes || null,
      data.color || '#14B8A6',
    ]
  );
  return rows[0];
};

const update = async (businessId, id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = { status: 'status', notes: 'notes', date: 'date', time: 'time', staffId: 'staff_id', staffName: 'staff_name' };
  for (const [jsKey, dbKey] of Object.entries(allowed)) {
    if (data[jsKey] !== undefined) {
      fields.push(`${dbKey} = $${idx++}`);
      values.push(data[jsKey]);
    }
  }

  if (!fields.length) return findById(businessId, id);
  fields.push('updated_at = NOW()');
  values.push(id, businessId);

  const { rows } = await query(
    `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${idx++} AND business_id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  return rows[0] || null;
};

const remove = async (businessId, id) => {
  const { rows } = await query(
    'UPDATE appointments SET deleted_at = NOW() WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL RETURNING id',
    [id, businessId]
  );
  return rows[0] || null;
};

const getTodayStats = async (businessId, date) => {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status != 'cancelled') AS total,
       COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
       COUNT(*) FILTER (WHERE status = 'pending') AS pending,
       COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
       COUNT(*) FILTER (WHERE status = 'completed') AS completed,
       COALESCE(SUM(price) FILTER (WHERE status IN ('confirmed','completed')), 0) AS revenue
     FROM appointments
     WHERE business_id = $1 AND date = $2 AND deleted_at IS NULL`,
    [businessId, date]
  );
  return rows[0];
};

module.exports = { findAll, findById, create, update, remove, getTodayStats };
