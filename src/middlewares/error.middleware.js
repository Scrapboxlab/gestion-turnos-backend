const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const errorMiddleware = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ status: 'error', message: 'Ya existe un registro con esos datos' });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ status: 'error', message: 'Referencia a un registro que no existe' });
  }

  // Zod validation
  if (err.name === 'ZodError') {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors: messages });
  }

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
};

module.exports = errorMiddleware;
