const { query, getClient } = require('../config/database');

const findAll = async (businessId) => {
  const { rows } = await query(
    `SELECT s.*,
       COALESCE(
         json_agg(ss.service_id) FILTER (WHERE ss.service_id IS NOT NULL), '[]'
       ) AS services
     FROM staff s
     LEFT JOIN staff_services ss ON ss.staff_id = s.id
     WHERE s.business_id = $1 AND s.deleted_at IS NULL
     GROUP BY s.id
     ORDER BY s.name`,
    [businessId]
  );
  return rows;
};

const findById = async (businessId, id) => {
  const { rows } = await query(
    `SELECT s.*,
       COALESCE(
         json_agg(ss.service_id) FILTER (WHERE ss.service_id IS NOT NULL), '[]'
       ) AS services
     FROM staff s
     LEFT JOIN staff_services ss ON ss.staff_id = s.id
     WHERE s.id = $1 AND s.business_id = $2 AND s.deleted_at IS NULL
     GROUP BY s.id`,
    [id, businessId]
  );
  return rows[0] || null;
};

const create = async (businessId, data) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: [staff] } = await client.query(
      `INSERT INTO staff (business_id, name, role, work_hours_start, work_hours_end, days_off, rating, appointments_count)
       VALUES ($1,$2,$3,$4,$5,$6,0,0) RETURNING *`,
      [
        businessId, data.name, data.role,
        data.workHours?.start || '09:00',
        data.workHours?.end || '18:00',
        data.daysOff || [0],
      ]
    );
    for (const serviceId of (data.services || [])) {
      await client.query('INSERT INTO staff_services (staff_id, service_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [staff.id, serviceId]);
    }
    await client.query('COMMIT');
    return { ...staff, services: data.services || [] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const update = async (businessId, id, data) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role); }
    if (data.workHours?.start !== undefined) { fields.push(`work_hours_start = $${idx++}`); values.push(data.workHours.start); }
    if (data.workHours?.end !== undefined) { fields.push(`work_hours_end = $${idx++}`); values.push(data.workHours.end); }
    if (data.daysOff !== undefined) { fields.push(`days_off = $${idx++}`); values.push(data.daysOff); }
    if (data.rating !== undefined) { fields.push(`rating = $${idx++}`); values.push(data.rating); }

    let updatedStaff;
    if (fields.length) {
      fields.push('updated_at = NOW()');
      values.push(id, businessId);
      const { rows } = await client.query(
        `UPDATE staff SET ${fields.join(', ')} WHERE id = $${idx++} AND business_id = $${idx} AND deleted_at IS NULL RETURNING *`,
        values
      );
      updatedStaff = rows[0];
    }

    if (data.services !== undefined) {
      await client.query('DELETE FROM staff_services WHERE staff_id = $1', [id]);
      for (const serviceId of data.services) {
        await client.query('INSERT INTO staff_services (staff_id, service_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, serviceId]);
      }
    }

    await client.query('COMMIT');
    return findById(businessId, id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const remove = async (businessId, id) => {
  const { rows } = await query(
    'UPDATE staff SET deleted_at = NOW() WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL RETURNING id',
    [id, businessId]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove };
