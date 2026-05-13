const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/booking.service');
const { z } = require('zod');

const publicBookingSchema = z.object({
  businessId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive('Servicio requerido'),
  staffId: z.number().int().min(0).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().min(6, 'Teléfono requerido'),
  email: z.string().email('Email inválido'),
  notes: z.string().optional(),
});

const getServices = asyncHandler(async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  const data = await bookingService.getPublicServices(businessId);
  res.json({ status: 'success', data });
});

const getStaff = asyncHandler(async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  const { serviceId } = req.query;
  const data = await bookingService.getPublicStaff(businessId, serviceId ? parseInt(serviceId) : null);
  res.json({ status: 'success', data });
});

const getAvailability = asyncHandler(async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  const { staffId, date, serviceId } = req.query;
  const data = await bookingService.getAvailability(businessId, {
    staffId: staffId ? parseInt(staffId) : null,
    date,
    serviceId: serviceId ? parseInt(serviceId) : null,
  });
  res.json({ status: 'success', data });
});

const createBooking = asyncHandler(async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  const result = publicBookingSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors: messages });
  }
  const data = await bookingService.createPublicBooking(businessId, result.data);
  res.status(201).json({ status: 'success', data });
});

module.exports = { getServices, getStaff, getAvailability, createBooking };
