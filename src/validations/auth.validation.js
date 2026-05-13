const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const registerSchema = z.object({
  business: z.string().min(2, 'Nombre del negocio requerido'),
  category: z.string().min(1, 'Categoría requerida'),
  phone: z.string().optional(),
  owner: z.string().min(2, 'Nombre del propietario requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

module.exports = { loginSchema, registerSchema };
