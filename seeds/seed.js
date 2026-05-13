require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Business
    const { rows: [business] } = await client.query(`
      INSERT INTO businesses (name, category, phone, email, address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['Beauty Studio', 'Peluquería / Barbería', '+54 9 11 0000-0000', 'hola@beautystudio.com', 'Av. Corrientes 1234, CABA']);

    if (!business) {
      logger.info('Seed data already exists, skipping.');
      await client.query('ROLLBACK');
      return;
    }

    const businessId = business.id;

    // Admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (business_id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
    `, [businessId, 'Administrador', 'admin@beautystudio.com', passwordHash, 'admin']);

    // Business settings
    await client.query(`
      INSERT INTO business_settings (business_id, min_notice_hours, max_advance_days, auto_confirm, allow_cancellation, cancellation_hours)
      VALUES ($1, 2, 30, true, true, 24)
    `, [businessId]);

    // Business hours (Mon-Sat open, Sun closed)
    for (let day = 0; day <= 6; day++) {
      const isOpen = day !== 0; // Sunday closed
      const closeTime = day === 6 ? '17:00' : '19:00';
      await client.query(`
        INSERT INTO business_hours (business_id, day_of_week, is_open, open_time, close_time)
        VALUES ($1, $2, $3, '09:00', $4)
      `, [businessId, day, isOpen, closeTime]);
    }

    // Services
    const serviceData = [
      { name: 'Corte de cabello', duration: 30, price: 3500, category: 'Cortes', color: '#14B8A6', active: true },
      { name: 'Coloración completa', duration: 120, price: 12000, category: 'Color', color: '#8B5CF6', active: true },
      { name: 'Mechas/Balayage', duration: 150, price: 18000, category: 'Color', color: '#F59E0B', active: true },
      { name: 'Tratamiento capilar', duration: 60, price: 5500, category: 'Tratamientos', color: '#22C55E', active: true },
      { name: 'Manicura', duration: 45, price: 2800, category: 'Uñas', color: '#EC4899', active: true },
      { name: 'Pedicura', duration: 60, price: 3200, category: 'Uñas', color: '#EF4444', active: true },
      { name: 'Facial básico', duration: 60, price: 6500, category: 'Faciales', color: '#6366F1', active: false },
      { name: 'Extensión de pestañas', duration: 90, price: 9000, category: 'Estética', color: '#0EA5E9', active: true },
    ];

    const serviceIds = [];
    for (const svc of serviceData) {
      const { rows: [s] } = await client.query(`
        INSERT INTO services (business_id, name, duration, price, category, color, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [businessId, svc.name, svc.duration, svc.price, svc.category, svc.color, svc.active]);
      serviceIds.push(s.id);
    }

    // Staff
    const staffData = [
      { name: 'Andrea Pérez', role: 'Estilista Senior', start: '09:00', end: '18:00', daysOff: [0], rating: 4.9, appointments: 142, serviceIndexes: [0,1,2,3] },
      { name: 'Diego Castro', role: 'Barbero', start: '10:00', end: '19:00', daysOff: [0,1], rating: 4.7, appointments: 98, serviceIndexes: [0] },
      { name: 'María Vega', role: 'Esteticista', start: '09:00', end: '17:00', daysOff: [0], rating: 4.8, appointments: 76, serviceIndexes: [4,5,6,7] },
      { name: 'Carlos Ruiz', role: 'Colorista', start: '11:00', end: '20:00', daysOff: [0,3], rating: 4.6, appointments: 89, serviceIndexes: [1,2,3] },
    ];

    const staffIds = [];
    for (const m of staffData) {
      const { rows: [s] } = await client.query(`
        INSERT INTO staff (business_id, name, role, work_hours_start, work_hours_end, days_off, rating, appointments_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [businessId, m.name, m.role, m.start, m.end, m.daysOff, m.rating, m.appointments]);
      staffIds.push(s.id);

      for (const si of m.serviceIndexes) {
        await client.query('INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2)', [s.id, serviceIds[si]]);
      }
    }

    // Clients
    const clientData = [
      { name: 'Valentina Torres', email: 'valentina@email.com', phone: '+54 9 11 2345-6789', tags: ['VIP','Regular'], totalSpent: 24800, visits: 18, lastVisit: '2026-05-08', notes: 'Prefiere turno por la mañana' },
      { name: 'Rodrigo Méndez', email: 'rodrigo@email.com', phone: '+54 9 11 3456-7890', tags: ['Nuevo'], totalSpent: 3200, visits: 2, lastVisit: '2026-05-10', notes: '' },
      { name: 'Camila Sánchez', email: 'camila@email.com', phone: '+54 9 11 4567-8901', tags: ['Regular'], totalSpent: 11500, visits: 9, lastVisit: '2026-05-05', notes: 'Alergia a ciertos productos' },
      { name: 'Lucas Fernández', email: 'lucas@email.com', phone: '+54 9 11 5678-9012', tags: ['VIP'], totalSpent: 38600, visits: 31, lastVisit: '2026-05-09', notes: 'Cliente desde 2023' },
      { name: 'Sofía Ramírez', email: 'sofia@email.com', phone: '+54 9 11 6789-0123', tags: ['Regular'], totalSpent: 8900, visits: 6, lastVisit: '2026-04-28', notes: '' },
      { name: 'Matías González', email: 'matias@email.com', phone: '+54 9 11 7890-1234', tags: ['Nuevo'], totalSpent: 1800, visits: 1, lastVisit: '2026-05-11', notes: 'Primera vez' },
      { name: 'Isabella López', email: 'isabella@email.com', phone: '+54 9 11 8901-2345', tags: ['VIP','Regular'], totalSpent: 52100, visits: 44, lastVisit: '2026-05-07', notes: 'Trato preferencial' },
      { name: 'Tomás Martínez', email: 'tomas@email.com', phone: '+54 9 11 9012-3456', tags: ['Regular'], totalSpent: 6700, visits: 5, lastVisit: '2026-04-20', notes: '' },
    ];

    const clientIds = [];
    for (const c of clientData) {
      const { rows: [cl] } = await client.query(`
        INSERT INTO clients (business_id, name, email, phone, tags, notes, total_spent, visits, last_visit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [businessId, c.name, c.email, c.phone, c.tags, c.notes, c.totalSpent, c.visits, c.lastVisit || null]);
      clientIds.push(cl.id);
    }

    // Appointments
    const apptData = [
      { clientIdx: 0, staffIdx: 0, svcIdx: 1, date: '2026-05-11', time: '09:00', duration: 120, price: 12000, status: 'confirmed', notes: 'Raíces grises', color: '#8B5CF6' },
      { clientIdx: 2, staffIdx: 1, svcIdx: 0, date: '2026-05-11', time: '10:30', duration: 30, price: 3500, status: 'pending', notes: '', color: '#14B8A6' },
      { clientIdx: 3, staffIdx: 2, svcIdx: 4, date: '2026-05-11', time: '11:00', duration: 45, price: 2800, status: 'confirmed', notes: 'Color nude', color: '#EC4899' },
      { clientIdx: 6, staffIdx: 3, svcIdx: 2, date: '2026-05-11', time: '11:30', duration: 150, price: 18000, status: 'confirmed', notes: 'Tonos cálidos', color: '#F59E0B' },
      { clientIdx: 1, staffIdx: 1, svcIdx: 0, date: '2026-05-11', time: '14:00', duration: 30, price: 3500, status: 'completed', notes: '', color: '#14B8A6' },
      { clientIdx: 4, staffIdx: 0, svcIdx: 3, date: '2026-05-11', time: '15:00', duration: 60, price: 5500, status: 'cancelled', notes: 'Canceló por enfermedad', color: '#22C55E' },
      { clientIdx: 7, staffIdx: 2, svcIdx: 7, date: '2026-05-12', time: '10:00', duration: 90, price: 9000, status: 'pending', notes: '', color: '#0EA5E9' },
      { clientIdx: 0, staffIdx: 0, svcIdx: 0, date: '2026-05-13', time: '09:30', duration: 30, price: 3500, status: 'confirmed', notes: '', color: '#14B8A6' },
      { clientIdx: 5, staffIdx: 1, svcIdx: 0, date: '2026-05-14', time: '11:00', duration: 30, price: 3500, status: 'pending', notes: 'Primera vez', color: '#14B8A6' },
      { clientIdx: 3, staffIdx: 3, svcIdx: 1, date: '2026-05-15', time: '13:00', duration: 120, price: 12000, status: 'confirmed', notes: '', color: '#8B5CF6' },
    ];

    const apptIds = [];
    for (const a of apptData) {
      const cl = clientData[a.clientIdx];
      const st = staffData[a.staffIdx];
      const sv = serviceData[a.svcIdx];
      const { rows: [appt] } = await client.query(`
        INSERT INTO appointments (business_id, client_id, client_name, client_phone, client_email, staff_id, staff_name, service_id, service_name, date, time, duration, price, status, notes, color)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id
      `, [businessId, clientIds[a.clientIdx], cl.name, cl.phone, cl.email, staffIds[a.staffIdx], st.name, serviceIds[a.svcIdx], sv.name, a.date, a.time, a.duration, a.price, a.status, a.notes, a.color]);
      apptIds.push(appt.id);
    }

    // Payments
    const paymentData = [
      { clientName: 'Valentina Torres', service: 'Coloración completa', amount: 12000, date: '2026-05-11', status: 'paid', method: 'Efectivo', apptIdx: 0 },
      { clientName: 'Lucas Fernández', service: 'Manicura', amount: 2800, date: '2026-05-11', status: 'paid', method: 'Transferencia', apptIdx: 2 },
      { clientName: 'Rodrigo Méndez', service: 'Corte de cabello', amount: 3500, date: '2026-05-11', status: 'paid', method: 'Tarjeta', apptIdx: 4 },
      { clientName: 'Isabella López', service: 'Mechas/Balayage', amount: 18000, date: '2026-05-11', status: 'pending', method: null, apptIdx: 3 },
      { clientName: 'Camila Sánchez', service: 'Corte de cabello', amount: 3500, date: '2026-05-10', status: 'paid', method: 'Efectivo', apptIdx: null },
      { clientName: 'Tomás Martínez', service: 'Extensión de pestañas', amount: 9000, date: '2026-05-12', status: 'pending', method: null, apptIdx: 6 },
    ];

    for (const p of paymentData) {
      await client.query(`
        INSERT INTO payments (business_id, appointment_id, client_name, service_name, amount, date, status, method)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [businessId, p.apptIdx !== null ? apptIds[p.apptIdx] : null, p.clientName, p.service, p.amount, p.date, p.status, p.method]);
    }

    // Notifications
    const notifData = [
      { type: 'booking', title: 'Nuevo turno', message: 'Valentina Torres reservó Coloración completa para hoy 09:00', read: false },
      { type: 'cancellation', title: 'Turno cancelado', message: 'Sofía Ramírez canceló su turno de las 15:00', read: false },
      { type: 'reminder', title: 'Recordatorio', message: 'Lucas Fernández tiene turno en 30 minutos', read: true },
      { type: 'booking', title: 'Nuevo turno', message: 'Matías González reservó Corte de cabello', read: true },
      { type: 'payment', title: 'Pago recibido', message: 'Rodrigo Méndez pagó $3.500 por Corte de cabello', read: true },
    ];

    for (const n of notifData) {
      await client.query(`
        INSERT INTO notifications (business_id, type, title, message, read)
        VALUES ($1,$2,$3,$4,$5)
      `, [businessId, n.type, n.title, n.message, n.read]);
    }

    await client.query('COMMIT');
    logger.info('Seed completed successfully');
    logger.info('Login credentials: admin@beautystudio.com / admin123');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
