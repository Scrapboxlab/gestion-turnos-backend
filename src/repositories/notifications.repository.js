const { query } = require('../config/database');

const findAll = async (businessId, { unreadOnly = false } = {}) => {
  let sql = 'SELECT * FROM notifications WHERE business_id = $1';
  if (unreadOnly) sql += ' AND read = FALSE';
  sql += ' ORDER BY created_at DESC LIMIT 100';
  const { rows } = await query(sql, [businessId]);
  return rows;
};

const create = async (businessId, data) => {
  const { rows } = await query(
    'INSERT INTO notifications (business_id, type, title, message) VALUES ($1,$2,$3,$4) RETURNING *',
    [businessId, data.type, data.title, data.message || null]
  );
  return rows[0];
};

const markAsRead = async (businessId, id) => {
  const { rows } = await query(
    'UPDATE notifications SET read = TRUE WHERE id = $1 AND business_id = $2 RETURNING *',
    [id, businessId]
  );
  return rows[0] || null;
};

const markAllAsRead = async (businessId) => {
  await query('UPDATE notifications SET read = TRUE WHERE business_id = $1 AND read = FALSE', [businessId]);
};

const deleteAll = async (businessId) => {
  await query('DELETE FROM notifications WHERE business_id = $1', [businessId]);
};

const getUnreadCount = async (businessId) => {
  const { rows } = await query(
    'SELECT COUNT(*) AS count FROM notifications WHERE business_id = $1 AND read = FALSE',
    [businessId]
  );
  return parseInt(rows[0].count);
};

module.exports = { findAll, create, markAsRead, markAllAsRead, deleteAll, getUnreadCount };
