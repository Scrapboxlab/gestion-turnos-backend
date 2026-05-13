const { z } = require('zod');

const workHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
});

const createStaffSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  role: z.string().min(1, 'Rol requerido'),
  workHours: workHoursSchema.optional(),
  daysOff: z.array(z.number().int().min(0).max(6)).default([0]),
  services: z.array(z.number().int().positive()).default([]),
});

const updateStaffSchema = createStaffSchema.partial();

module.exports = { createStaffSchema, updateStaffSchema };
