const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

const getStats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStats(req.businessId);
  res.json({ status: 'success', data });
});

module.exports = { getStats };
