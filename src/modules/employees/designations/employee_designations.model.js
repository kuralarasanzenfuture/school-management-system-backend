import { getDB } from "../../../config/db.js";

export const EmployeeDesignationModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO employee_designations SET ?`,
      [data]
    );
    return result.insertId;
  },

  findById: async (id, connOrDb = null) => {
    const db = connOrDb || getDB();
    const [[row]] = await db.query(
      `SELECT d.*, s.name AS school_name, s.code AS school_code
       FROM employee_designations d
       LEFT JOIN schools s ON d.school_id = s.id
       WHERE d.id=?`,
      [id]
    );
    return row;
  },

  findWithFilters: async (
    dbOrConn,
    { whereClause = "", values = [], orderClause = "ORDER BY d.id DESC", limitClause = "" }
  ) => {
    const query = `
      SELECT 
        d.*,
        s.name AS school_name,
        s.code AS school_code
      FROM employee_designations d
      LEFT JOIN schools s ON d.school_id = s.id
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `;
    const [rows] = await dbOrConn.query(query, values);
    return rows;
  },

  countWithFilters: async (dbOrConn, { whereClause = "", values = [] }) => {
    const query = `
      SELECT COUNT(*) AS total
      FROM employee_designations d
      LEFT JOIN schools s ON d.school_id = s.id
      ${whereClause}
    `;
    const [[row]] = await dbOrConn.query(query, values);
    return Number(row?.total || 0);
  },

  getAllSchool: async ({ school_id } = {}) => {
    const db = getDB();

    let query = `SELECT d.*, s.name AS school_name, s.code AS school_code FROM employee_designations d LEFT JOIN schools s ON d.school_id = s.id WHERE 1=1`;
    const values = [];

    if (school_id) {
      query += ` AND d.school_id=?`;
      values.push(school_id);
    }

    query += ` ORDER BY d.name ASC`;

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