const { z } = require('zod');

const createPaymentSchema = z.object({
  appointmentId: z.number().int().positive().optional(),
  clientName: z.string().min(2),
  serviceName: z.string().min(1),
  amount: z.number().positive('El monto debe ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['paid', 'pending']).default('pending'),
  method: z.enum(['Efectivo', 'Transferencia', 'Tarjeta']).optional(),
});

const updatePaymentSchema = z.object({
  status: z.enum(['paid', 'pending']).optional(),
  method: z.enum(['Efectivo', 'Transferencia', 'Tarjeta']).optional(),
});

module.exports = { createPaymentSchema, updatePaymentSchema };
