const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticación requerido', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, business_id, name, email, role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    );
    if (!rows[0]) return next(new AppError('Usuario no encontrado', 401));
    req.user = rows[0];
    req.businessId = rows[0].business_id;
    next();
  } catch {
    next(new AppError('Token inválido o expirado', 401));
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError('No tenés permisos para esta acción', 403));
  }
  next();
};

module.exports = { authenticate, requireRole };
