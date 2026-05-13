const { z } = require('zod');

const createAppointmentSchema = z.object({
  clientName: z.string().min(2, 'Nombre del cliente requerido'),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive('Servicio requerido'),
  staffId: z.number().int().positive('Profesional requerido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  duration: z.number().int().min(15).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'noshow']).default('pending'),
});

const updateAppointmentSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'noshow']).optional(),
  notes: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  staffId: z.number().int().positive().optional(),
});

module.exports = { createAppointmentSchema, updateAppointmentSchema };
