const { query } = require('../config/database');

const findAll = async (businessId, { activeOnly = false } = {}) => {
  let sql = 'SELECT * FROM services WHERE business_id = $1 AND deleted_at IS NULL';
  if (activeOnly) sql += ' AND active = TRUE';
  sql += ' ORDER BY category, name';
  const { rows } = await query(sql, [businessId]);
  return rows;
};

const findById = async (businessId, id) => {
  const { rows } = await query(
    'SELECT * FROM services WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
    [id, businessId]
  );
  return rows[0] || null;
};

const create = async (businessId, data) => {
  const { rows } = await query(
    `INSERT INTO services (business_id, name, duration, price, category, color, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [businessId, data.name, data.duration, data.price, data.category, data.color || '#14B8A6', data.active !== false]
  );
  return rows[0];
};

const update = async (businessId, id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ['name', 'duration', 'price', 'category', 'color', 'active'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (!fields.length) return findById(businessId, id);
  fields.push('updated_at = NOW()');
  values.push(id, businessId);

  const { rows } = await query(
    `UPDATE services SET ${fields.join(', ')} WHERE id = $${idx++} AND business_id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  return rows[0] || null;
};

const remove = async (businessId, id) => {
  const { rows } = await query(
    'UPDATE services SET deleted_at = NOW() WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL RETURNING id',
    [id, businessId]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove };
