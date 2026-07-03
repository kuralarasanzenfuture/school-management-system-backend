import { getDB } from "../../../config/db.js";

export const EmployeeDesignationModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO employee_designations SET ?`,
      [data]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();
    const [[row]] = await db.query(
      `SELECT * FROM employee_designations WHERE id=?`,
      [id]
    );
    return row;
  },

  getAllSchool: async ({ school_id } = {}) => {
    const db = getDB();

    let query = `SELECT * FROM employee_designations WHERE 1=1`;
    const values = [];

    if (school_id) {
      query += ` AND school_id=?`;
      values.push(school_id);
    }

    query += ` ORDER BY name`;

    const [rows] = await db.query(query, values);
    return rows;
  },

  update: async (conn, id, data) => {
    await conn.query(
      `UPDATE employee_designations SET ? WHERE id=?`,
      [data, id]
    );
  },

  delete: async (conn, id) => {
    await conn.query(
      `DELETE FROM employee_designations WHERE id=?`,
      [id]
    );
  },
};