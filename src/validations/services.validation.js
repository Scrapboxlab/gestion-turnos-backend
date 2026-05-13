const { z } = require('zod');

const createServiceSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  duration: z.number().int().min(15, 'Duración mínima 15 minutos'),
  price: z.number().min(0, 'Precio no puede ser negativo'),
  category: z.string().min(1, 'Categoría requerida'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
  active: z.boolean().default(true),
});

const updateServiceSchema = createServiceSchema.partial();

module.exports = { createServiceSchema, updateServiceSchema };
