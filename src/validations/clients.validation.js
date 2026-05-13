const { z } = require('zod');

const createClientSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  tags: z.array(z.enum(['VIP', 'Regular', 'Nuevo'])).default([]),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

module.exports = { createClientSchema, updateClientSchema };
