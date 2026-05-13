const asyncHandler = require('../utils/asyncHandler');
const notificationsService = require('../services/notifications.service');

const getAll = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  const data = await notificationsService.getAll(req.businessId, { unreadOnly: unreadOnly === 'true' });
  res.json({ status: 'success', data });
});

const markAsRead = asyncHandler(async (req, res) => {
  const data = await notificationsService.markAsRead(req.businessId, parseInt(req.params.id));
  res.json({ status: 'success', data });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllAsRead(req.businessId);
  res.json({ status: 'success', message: 'Todas las notificaciones marcadas como leídas' });
});

const deleteAll = asyncHandler(async (req, res) => {
  await notificationsService.deleteAll(req.businessId);
  res.json({ status: 'success', message: 'Notificaciones eliminadas' });
});

module.exports = { getAll, markAsRead, markAllAsRead, deleteAll };
