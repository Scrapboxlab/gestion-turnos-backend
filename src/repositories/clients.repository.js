const { query } = require('../config/database');

const findAll = async (businessId, { search, tag } = {}) => {
  let sql = `
    SELECT id, name, email, phone, tags, notes, total_spent, visits, last_visit, created_at
    FROM clients
    WHERE business_id = $1 AND deleted_at IS NULL
  `;
  const params = [businessId];
  let idx = 2;

  if (search) {
    sql += ` AND (name ILIKE $${idx} OR email ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  if (tag && tag !== 'todos') {
    sql += ` AND $${idx} = ANY(tags)`;
    params.push(tag);
    idx++;
  }

  sql += ' ORDER BY name ASC';
  const { rows } = await query(sql, params);
  return rows;
};

const findById = async (businessId, id) => {
  const { rows } = await query(
    'SELECT * FROM clients WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
    [id, businessId]
  );
  return rows[0] || null;
};

const create = async (businessId, data) => {
  const { rows } = await query(
    `INSERT INTO clients (business_id, name, email, phone, tags, notes, total_spent, visits)
     VALUES ($1,$2,$3,$4,$5,$6,0,0) RETURNING *`,
    [businessId, data.name, data.email || null, data.phone || null, data.tags || [], data.notes || null]
  );
  return rows[0];
};

const update = async (businessId, id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email || null); }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone || null); }
  if (data.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(data.tags); }
  if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(data.notes || null); }

  if (!fields.length) return findById(businessId, id);

  fields.push(`updated_at = NOW()`);
  values.push(id, businessId);

  const { rows } = await query(
    `UPDATE clients SET ${fields.join(', ')} WHERE id = $${idx++} AND business_id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  return rows[0] || null;
};

const remove = async (businessId, id) => {
  const { rows } = await query(
    'UPDATE clients SET deleted_at = NOW() WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL RETURNING id',
    [id, businessId]
  );
  return rows[0] || null;
};

const updateStats = async (businessId, clientId, { totalSpent, visits, lastVisit }) => {
  await query(
    `UPDATE clients SET total_spent = $1, visits = $2, last_visit = $3, updated_at = NOW()
     WHERE id = $4 AND business_id = $5`,
    [totalSpent, visits, lastVisit, clientId, businessId]
  );
};

module.exports = { findAll, findById, create, update, remove, updateStats };
