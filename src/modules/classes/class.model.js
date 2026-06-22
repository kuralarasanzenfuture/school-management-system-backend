import { getDB } from "../../config/db.js";

export const ClassModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO classes (school_id, name, status)
       VALUES (?, ?, ?)`,
      [data.school_id, data.name, data.status]
    );

    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();
    const [[row]] = await db.query(
      `SELECT * FROM classes WHERE id=?`,
      [id]
    );
    return row;
  },

  findDuplicate: async (school_id, name, excludeId = null) => {
    const db = getDB();

    let query = `
      SELECT id FROM classes
      WHERE school_id=? AND name=?
    `;

    const params = [school_id, name];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [[row]] = await db.query(query, params);
    return row;
  },

  getAllBySchool: async (school_id) => {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM classes WHERE school_id=? ORDER BY name ASC`,
      [school_id]
    );
    return rows;
  },

  getAll: async (school_id) => {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM classes ORDER BY name ASC`,
      [school_id]
    );
    return rows;
  },

  update: async (conn, id, fields, values) => {
    const query = `UPDATE classes SET ${fields.join(", ")} WHERE id=?`;
    await conn.query(query, [...values, id]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM classes WHERE id=?`, [id]);
  },
};