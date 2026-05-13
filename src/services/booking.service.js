const { query } = require('../config/database');
const appointmentsRepo = require('../repositories/appointments.repository');
const notificationsRepo = require('../repositories/notifications.repository');
const AppError = require('../utils/AppError');

// Public booking page: get active services for a business
const getPublicServices = async (businessId) => {
  const { rows } = await query(
    'SELECT id, name, duration, price, category, color FROM services WHERE business_id = $1 AND active = TRUE AND deleted_at IS NULL ORDER BY category, name',
    [businessId]
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    duration: r.duration,
    price: parseFloat(r.price),
    category: r.category,
    color: r.color,
  }));
};

// Public booking page: get available staff for a service
const getPublicStaff = async (businessId, serviceId) => {
  let sql = `
    SELECT s.id, s.name, s.role, s.rating, s.work_hours_start, s.work_hours_end, s.days_off
    FROM staff s
    WHERE s.business_id = $1 AND s.deleted_at IS NULL
  `;
  const params = [businessId];

  if (serviceId) {
    sql += ' AND EXISTS (SELECT 1 FROM staff_services ss WHERE ss.staff_id = s.id AND ss.service_id = $2)';
    params.push(serviceId);
  }

  sql += ' ORDER BY s.name';
  const { rows } = await query(sql, params);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    role: r.role,
    rating: parseFloat(r.rating || 0),
    workHours: {
      start: typeof r.work_hours_start === 'string' ? r.work_hours_start.slice(0, 5) : r.work_hours_start,
      end: typeof r.work_hours_end === 'string' ? r.work_hours_end.slice(0, 5) : r.work_hours_end,
    },
    daysOff: r.days_off || [],
  }));
};

// Get available time slots for a staff member on a date
const getAvailability = async (businessId, { staffId, date, serviceId }) => {
  if (!date || !staffId) throw new AppError('Fecha y profesional son requeridos', 400);

  const { rows: staffRows } = await query(
    'SELECT * FROM staff WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
    [staffId, businessId]
  );
  const staffMember = staffRows[0];
  if (!staffMember) throw new AppError('Profesional no encontrado', 404);

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  if (staffMember.days_off.includes(dayOfWeek)) {
    return { available: [], date, staffId };
  }

  let serviceDuration = 30;
  if (serviceId) {
    const { rows: svcRows } = await query(
      'SELECT duration FROM services WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
      [serviceId, businessId]
    );
    if (svcRows[0]) serviceDuration = svcRows[0].duration;
  }

  // Get taken slots
  const { rows: taken } = await query(
    `SELECT time, duration FROM appointments
     WHERE business_id = $1 AND staff_id = $2 AND date = $3
       AND status NOT IN ('cancelled') AND deleted_at IS NULL`,
    [businessId, staffId, date]
  );

  const takenMinutes = taken.map(t => {
    const [h, m] = (typeof t.time === 'string' ? t.time : '00:00').split(':').map(Number);
    return { start: h * 60 + m, end: h * 60 + m + t.duration };
  });

  const startHour = parseInt((staffMember.work_hours_start || '09:00').split(':')[0]);
  const endHour = parseInt((staffMember.work_hours_end || '18:00').split(':')[0]);

  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + serviceDuration;
      if (slotEnd > endHour * 60) break;
      const isTaken = takenMinutes.some(t => slotStart < t.end && slotEnd > t.start);
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ time: timeStr, available: !isTaken });
    }
  }

  return { available: slots, date, staffId };
};

// Create a public booking (no auth required)
const createPublicBooking = async (businessId, data) => {
  const { rows: svcRows } = await query(
    'SELECT * FROM services WHERE id = $1 AND business_id = $2 AND active = TRUE AND deleted_at IS NULL',
    [data.serviceId, businessId]
  );
  const service = svcRows[0];
  if (!service) throw new AppError('Servicio no disponible', 404);

  let staffMember = null;
  if (data.staffId && data.staffId !== 0) {
    const { rows: staffRows } = await query(
      'SELECT * FROM staff WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
      [data.staffId, businessId]
    );
    staffMember = staffRows[0];
    if (!staffMember) throw new AppError('Profesional no disponible', 404);
  } else {
    // Assign first available staff
    const { rows: anyStaff } = await query(
      `SELECT s.* FROM staff s
       JOIN staff_services ss ON ss.staff_id = s.id
       WHERE s.business_id = $1 AND ss.service_id = $2 AND s.deleted_at IS NULL LIMIT 1`,
      [businessId, data.serviceId]
    );
    staffMember = anyStaff[0];
    if (!staffMember) throw new AppError('No hay profesionales disponibles', 400);
  }

  // Check for conflicts
  const { rows: conflicts } = await query(
    `SELECT id FROM appointments
     WHERE business_id = $1 AND staff_id = $2 AND date = $3 AND time = $4
       AND status NOT IN ('cancelled') AND deleted_at IS NULL`,
    [businessId, staffMember.id, data.date, data.time]
  );
  if (conflicts.length) throw new AppError('El horario ya no está disponible', 409);

  // Get booking rules
  const { rows: rules } = await query(
    'SELECT * FROM business_settings WHERE business_id = $1',
    [businessId]
  );
  const autoConfirm = rules[0]?.auto_confirm ?? true;

  const row = await appointmentsRepo.create(businessId, {
    clientName: data.name,
    clientPhone: data.phone,
    clientEmail: data.email,
    serviceId: service.id,
    serviceName: service.name,
    staffId: staffMember.id,
    staffName: staffMember.name,
    date: data.date,
    time: data.time,
    duration: service.duration,
    price: parseFloat(service.price),
    status: autoConfirm ? 'confirmed' : 'pending',
    notes: data.notes || null,
    color: service.color,
  });

  await notificationsRepo.create(businessId, {
    type: 'booking',
    title: 'Nuevo turno',
    message: `${data.name} reservó ${service.name} para el ${data.date} ${data.time}`,
  });

  return {
    id: row.id,
    clientName: row.client_name,
    serviceName: row.service_name,
    staffName: row.staff_name,
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
    time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
    duration: row.duration,
    price: parseFloat(row.price),
    status: row.status,
  };
};

module.exports = { getPublicServices, getPublicStaff, getAvailability, createPublicBooking };
