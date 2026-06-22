import { getDB } from "../../config/db.js";

export const DepartmentModel = {

  async create(connection, data) {
    const [result] = await connection.query(
      `
      INSERT INTO departments (school_id, name, description)
      VALUES (?, ?, ?)
      `,
      [data.school_id, data.name, data.description]
    );

    return result.insertId;
  },

  async findById(id) {
    const db = getDB();
    const [[row]] = await db.query(
      `SELECT * FROM departments WHERE id=?`,
      [id]
    );
    return row;
  },

  async findDuplicate(school_id, name, excludeId = null) {
    const db = getDB();

    let query = `
      SELECT id FROM departments
      WHERE school_id=? AND name=?
    `;

    const params = [school_id, name];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows.length ? rows[0] : null;
  },

  async getAll() {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM departments ORDER BY id DESC`
    );
    return rows;
  },

  async getBySchool(school_id) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM departments WHERE school_id=?`,
      [school_id]
    );
    return rows;
  },

  async update(connection, id, fields, values) {
    await connection.query(
      `UPDATE departments SET ${fields.join(", ")} WHERE id=?`,
      [...values, id]
    );
  },

  async delete(connection, id) {
    await connection.query(
      `DELETE FROM departments WHERE id=?`,
      [id]
    );
  }
};