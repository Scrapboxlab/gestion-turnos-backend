const asyncHandler = require('../utils/asyncHandler');
const settingsService = require('../services/settings.service');

const getAll = asyncHandler(async (req, res) => {
  const data = await settingsService.getAll(req.businessId);
  res.json({ status: 'success', data });
});

const updateBusiness = asyncHandler(async (req, res) => {
  const data = await settingsService.updateBusiness(req.businessId, req.body);
  res.json({ status: 'success', data });
});

const updateHours = asyncHandler(async (req, res) => {
  const data = await settingsService.updateHours(req.businessId, req.body);
  res.json({ status: 'success', data });
});

const updateBookingRules = asyncHandler(async (req, res) => {
  const data = await settingsService.updateBookingRules(req.businessId, req.body);
  res.json({ status: 'success', data });
});

module.exports = { getAll, updateBusiness, updateHours, updateBookingRules };
