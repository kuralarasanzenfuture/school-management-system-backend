import { getDB } from "../../config/db.js";

export const ComponentModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO employee_salary_components SET ?`,
      [data],
    );
    return res.insertId;
  },

  async findById(dbOrConn, id) {
    const db = dbOrConn || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        esc.*,
        sc.name AS school_name,
        sc.code AS school_code
      FROM employee_salary_components esc
      LEFT JOIN schools sc ON esc.school_id = sc.id
      WHERE esc.id = ?
      `,
      [id],
    );
    return row;
  },

  async findDuplicate(conn, school_id, code, excludeId = null) {
    const [rows] = await conn.query(
      `SELECT id, name, code FROM employee_salary_components
       WHERE school_id = ? AND code = ? ${excludeId ? "AND id != ?" : ""}`,
      excludeId ? [school_id, code, excludeId] : [school_id, code],
    );
    return rows[0];
  },

  async findDuplicateName(conn, school_id, name, excludeId = null) {
    const [rows] = await conn.query(
      `SELECT id, name, code FROM employee_salary_components
       WHERE school_id = ? AND name = ? ${excludeId ? "AND id != ?" : ""}`,
      excludeId ? [school_id, name, excludeId] : [school_id, name],
    );
    return rows[0];
  },

  async findWithFilters(
    dbOrConn,
    { whereClause = "", values = [], orderClause = "ORDER BY esc.id DESC", limitClause = "" },
  ) {
    const db = dbOrConn || getDB();
    const query = `
      SELECT 
        esc.*,
        sc.name AS school_name,
        sc.code AS school_code
      FROM employee_salary_components esc
      LEFT JOIN schools sc ON esc.school_id = sc.id
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `;
    const [rows] = await db.query(query, values);
    return rows;
  },

  async countWithFilters(dbOrConn, { whereClause = "", values = [] }) {
    const db = dbOrConn || getDB();
    const query = `
      SELECT COUNT(*) AS total
      FROM employee_salary_components esc
      LEFT JOIN schools sc ON esc.school_id = sc.id
      ${whereClause}
    `;
    const [[row]] = await db.query(query, values);
    return Number(row?.total || 0);
  },

  async update(conn, id, data) {
    await conn.query(`UPDATE employee_salary_components SET ? WHERE id = ?`, [
      data,
      id,
    ]);
  },

  async delete(conn, id) {
    const [res] = await conn.query(
      `DELETE FROM employee_salary_components WHERE id = ?`,
      [id],
    );
    return res;
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        esc.*,
        sc.name AS school_name,
        sc.code AS school_code
      FROM employee_salary_components esc
      LEFT JOIN schools sc ON esc.school_id = sc.id
      ORDER BY esc.id DESC
    `);
    return rows;
  },
};
