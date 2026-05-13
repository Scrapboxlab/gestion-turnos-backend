const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const AppError = require('../utils/AppError');

const login = async ({ email, password }) => {
  const { rows } = await query(
    `SELECT u.*, b.name AS business_name FROM users u
     JOIN businesses b ON b.id = u.business_id
     WHERE u.email = $1 AND u.deleted_at IS NULL`,
    [email.toLowerCase().trim()]
  );

  const user = rows[0];
  if (!user) throw new AppError('Credenciales inválidas', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Credenciales inválidas', 401);

  const token = jwt.sign(
    { userId: user.id, businessId: user.business_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.business_id,
      businessName: user.business_name,
    },
  };
};

const register = async ({ business, category, phone, owner, email, password }) => {
  const { rows: existing } = await query(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase().trim()]
  );
  if (existing.length) throw new AppError('Ya existe una cuenta con ese email', 409);

  const client = (await require('../config/database').getClient());
  try {
    await client.query('BEGIN');

    const { rows: [newBusiness] } = await client.query(
      'INSERT INTO businesses (name, category, phone, email) VALUES ($1,$2,$3,$4) RETURNING *',
      [business, category, phone || null, email.toLowerCase().trim()]
    );

    const hash = await bcrypt.hash(password, 10);
    const { rows: [newUser] } = await client.query(
      'INSERT INTO users (business_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [newBusiness.id, owner, email.toLowerCase().trim(), hash, 'admin']
    );

    await client.query(
      'INSERT INTO business_settings (business_id) VALUES ($1)',
      [newBusiness.id]
    );

    for (let day = 0; day <= 6; day++) {
      const isOpen = day !== 0;
      await client.query(
        'INSERT INTO business_hours (business_id, day_of_week, is_open, open_time, close_time) VALUES ($1,$2,$3,$4,$5)',
        [newBusiness.id, day, isOpen, '09:00', day === 6 ? '17:00' : '19:00']
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      { userId: newUser.id, businessId: newBusiness.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        businessId: newBusiness.id,
        businessName: newBusiness.name,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { login, register };
