const { query } = require('../config/database');

const getBusiness = async (businessId) => {
  const { rows } = await query(
    'SELECT * FROM businesses WHERE id = $1 AND deleted_at IS NULL',
    [businessId]
  );
  return rows[0] || null;
};

const updateBusiness = async (businessId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ['name', 'category', 'phone', 'email', 'address', 'logo_url'];
  for (const key of allowed) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (data[camelKey] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[camelKey]);
    }
  }

  if (!fields.length) return getBusiness(businessId);
  fields.push('updated_at = NOW()');
  values.push(businessId);

  const { rows } = await query(
    `UPDATE businesses SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  return rows[0];
};

const getHours = async (businessId) => {
  const { rows } = await query(
    'SELECT * FROM business_hours WHERE business_id = $1 ORDER BY day_of_week',
    [businessId]
  );
  return rows;
};

const updateHours = async (businessId, hours) => {
  for (const h of hours) {
    await query(
      `INSERT INTO business_hours (business_id, day_of_week, is_open, open_time, close_time)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (business_id, day_of_week) DO UPDATE
       SET is_open = EXCLUDED.is_open, open_time = EXCLUDED.open_time, close_time = EXCLUDED.close_time`,
      [businessId, h.dayOfWeek, h.isOpen, h.openTime || '09:00', h.closeTime || '19:00']
    );
  }
  return getHours(businessId);
};

const getBookingRules = async (businessId) => {
  const { rows } = await query(
    'SELECT * FROM business_settings WHERE business_id = $1',
    [businessId]
  );
  return rows[0] || null;
};

const updateBookingRules = async (businessId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const map = {
    minNoticeHours: 'min_notice_hours',
    maxAdvanceDays: 'max_advance_days',
    autoConfirm: 'auto_confirm',
    allowCancellation: 'allow_cancellation',
    cancellationHours: 'cancellation_hours',
  };

  for (const [jsKey, dbKey] of Object.entries(map)) {
    if (data[jsKey] !== undefined) {
      fields.push(`${dbKey} = $${idx++}`);
      values.push(data[jsKey]);
    }
  }

  if (!fields.length) return getBookingRules(businessId);
  fields.push('updated_at = NOW()');
  values.push(businessId);

  const { rows } = await query(
    `INSERT INTO business_settings (business_id, ${Object.values(map).join(', ')})
     VALUES ($${idx}, $1, 30, true, true, 24)
     ON CONFLICT (business_id) DO UPDATE SET ${fields.join(', ')} WHERE business_settings.business_id = $${idx}
     RETURNING *`,
    [...values]
  );
  return rows[0];
};

const upsertBookingRules = async (businessId, data) => {
  const { rows } = await query(
    `INSERT INTO business_settings (business_id, min_notice_hours, max_advance_days, auto_confirm, allow_cancellation, cancellation_hours)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (business_id) DO UPDATE SET
       min_notice_hours = COALESCE(EXCLUDED.min_notice_hours, business_settings.min_notice_hours),
       max_advance_days = COALESCE(EXCLUDED.max_advance_days, business_settings.max_advance_days),
       auto_confirm = COALESCE(EXCLUDED.auto_confirm, business_settings.auto_confirm),
       allow_cancellation = COALESCE(EXCLUDED.allow_cancellation, business_settings.allow_cancellation),
       cancellation_hours = COALESCE(EXCLUDED.cancellation_hours, business_settings.cancellation_hours),
       updated_at = NOW()
     RETURNING *`,
    [
      businessId,
      data.minNoticeHours ?? 2,
      data.maxAdvanceDays ?? 30,
      data.autoConfirm ?? true,
      data.allowCancellation ?? true,
      data.cancellationHours ?? 24,
    ]
  );
  return rows[0];
};

module.exports = { getBusiness, updateBusiness, getHours, updateHours, getBookingRules, upsertBookingRules };
