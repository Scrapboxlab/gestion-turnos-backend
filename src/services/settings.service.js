const settingsRepo = require('../repositories/settings.repository');
const AppError = require('../utils/AppError');

const formatHour = (row) => ({
  dayOfWeek: row.day_of_week,
  day: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][row.day_of_week],
  isOpen: row.is_open,
  openTime: typeof row.open_time === 'string' ? row.open_time.slice(0, 5) : row.open_time,
  closeTime: typeof row.close_time === 'string' ? row.close_time.slice(0, 5) : row.close_time,
});

const formatBookingRules = (row) => ({
  minNoticeHours: row.min_notice_hours,
  maxAdvanceDays: row.max_advance_days,
  autoConfirm: row.auto_confirm,
  allowCancellation: row.allow_cancellation,
  cancellationHours: row.cancellation_hours,
});

const getAll = async (businessId) => {
  const [business, hours, rules] = await Promise.all([
    settingsRepo.getBusiness(businessId),
    settingsRepo.getHours(businessId),
    settingsRepo.getBookingRules(businessId),
  ]);

  if (!business) throw new AppError('Negocio no encontrado', 404);

  return {
    business: {
      id: business.id,
      name: business.name,
      category: business.category,
      phone: business.phone,
      email: business.email,
      address: business.address,
      logoUrl: business.logo_url,
    },
    hours: hours.map(formatHour),
    bookingRules: rules ? formatBookingRules(rules) : null,
  };
};

const updateBusiness = async (businessId, data) => {
  const row = await settingsRepo.updateBusiness(businessId, data);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    phone: row.phone,
    email: row.email,
    address: row.address,
    logoUrl: row.logo_url,
  };
};

const updateHours = async (businessId, { hours }) => {
  const rows = await settingsRepo.updateHours(businessId, hours);
  return rows.map(formatHour);
};

const updateBookingRules = async (businessId, data) => {
  const row = await settingsRepo.upsertBookingRules(businessId, data);
  return formatBookingRules(row);
};

module.exports = { getAll, updateBusiness, updateHours, updateBookingRules };
