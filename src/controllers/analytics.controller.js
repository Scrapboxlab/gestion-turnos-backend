const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analytics.service');

const getAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAnalytics(req.businessId);
  res.json({ status: 'success', data });
});

module.exports = { getAnalytics };
