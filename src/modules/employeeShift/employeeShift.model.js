import { getDB } from "../../config/db.js";

export const EmployeeShiftModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_shifts
      (school_id, name, start_time, end_time, grace_minutes, working_hours, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.name,
        data.start_time,
        data.end_time,
        data.grace_minutes,
        data.working_hours,
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

  //   async getAll(db) {
  //     const [rows] = await db.query(`
  //     SELECT
  //       es.*,
  //       sc.name AS school_name
  //     FROM employee_shifts es
  //     JOIN schools sc
  //       ON es.school_id = sc.id
  //     ORDER BY es.id DESC
  //   `);

  //     return rows;
  //   },

  async getAll(db) {
    const [rows] = await db.query(`
    SELECT 
      es.id,
      es.name,
      es.start_time,
      es.end_time,
      es.working_hours,
      es.grace_minutes,
      es.status,

      sc.id AS school_id,
      sc.name AS school_name,
      sc.code AS school_code

    FROM employee_shifts es
    JOIN schools sc ON es.school_id = sc.id
    ORDER BY es.id DESC
  `);

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
