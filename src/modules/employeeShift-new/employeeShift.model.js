import { getDB } from "../../config/db.js";

export const EmployeeShiftModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_shifts
      (school_id, name, shift_type, start_time, end_time, crosses_midnight, grace_minutes, working_hours, is_default, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.name,
        data.shift_type,
        data.start_time,
        data.end_time,
        data.crosses_midnight,
        data.grace_minutes,
        data.working_hours,
        data.is_default,
        data.status,
      ],
    );

    return res.insertId;
  },

  async findDuplicate(conn, school_id, name, excludeId = null) {
    const [rows] = await conn.query(
      `
      SELECT id FROM employee_shifts 
      WHERE school_id=? AND name=? ${excludeId ? "AND id!=?" : ""}
      `,
      excludeId ? [school_id, name, excludeId] : [school_id, name],
    );

    return rows[0];
  },

  async getAll(db, filters = {}) {
    let query = `
    SELECT 
      es.id,
      es.name,
      es.shift_type,
      es.start_time,
      es.end_time,
      es.crosses_midnight,
      es.working_hours,
      es.grace_minutes,
      es.is_default,
      es.status,

      sc.id AS school_id,
      sc.name AS school_name,
      sc.code AS school_code

    FROM employee_shifts es
    JOIN schools sc 
      ON es.school_id = sc.id
    WHERE 1=1
  `;

    const values = [];

    // 🔍 FILTERS (production ready)
    if (filters.school_id) {
      query += ` AND es.school_id = ?`;
      values.push(filters.school_id);
    }

    if (filters.status) {
      query += ` AND es.status = ?`;
      values.push(filters.status);
    }

    query += ` ORDER BY es.id DESC`;

    const [rows] = await db.query(query, values);
    return rows;
  },

  async findById(db, id) {
    const [[row]] = await db.query(`SELECT * FROM employee_shifts WHERE id=?`, [
      id,
    ]);
    return row;
  },

  async update(conn, id, fields, values) {
    await conn.query(
      `UPDATE employee_shifts SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM employee_shifts WHERE id=?`, [id]);
  },
};
