const notificationsRepo = require('../repositories/notifications.repository');

const formatNotification = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  read: row.read,
  time: row.created_at,
});

const getAll = async (businessId, { unreadOnly } = {}) => {
  const rows = await notificationsRepo.findAll(businessId, { unreadOnly });
  const unreadCount = await notificationsRepo.getUnreadCount(businessId);
  return { notifications: rows.map(formatNotification), unreadCount };
};

const markAsRead = async (businessId, id) => {
  const row = await notificationsRepo.markAsRead(businessId, id);
  return row ? formatNotification(row) : null;
};

const markAllAsRead = async (businessId) => {
  await notificationsRepo.markAllAsRead(businessId);
};

const deleteAll = async (businessId) => {
  await notificationsRepo.deleteAll(businessId);
};

module.exports = { getAll, markAsRead, markAllAsRead, deleteAll };
