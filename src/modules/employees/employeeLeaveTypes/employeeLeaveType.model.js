import { getDB } from "../../../config/db.js";

export const Model = {
  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO employee_leave_types SET ?`,
      [data],
    );
    return res.insertId;
  },

  async findDuplicate(conn, school_id, code, excludeId = null) {
    const [rows] = await conn.query(
      `SELECT id, name, code FROM employee_leave_types 
       WHERE school_id = ? AND code = ? ${excludeId ? "AND id != ?" : ""}`,
      excludeId ? [school_id, code, excludeId] : [school_id, code],
    );
    return rows[0];
  },

  async findDuplicateName(conn, school_id, name, excludeId = null) {
    const [rows] = await conn.query(
      `SELECT id, name, code FROM employee_leave_types 
       WHERE school_id = ? AND name = ? ${excludeId ? "AND id != ?" : ""}`,
      excludeId ? [school_id, name, excludeId] : [school_id, name],
    );
    return rows[0];
  },

  async findById(dbOrConn, id) {
    const db = dbOrConn || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        elt.*,
        sc.name AS school_name,
        sc.code AS school_code,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM employee_leave_types elt
      LEFT JOIN schools sc ON elt.school_id = sc.id
      LEFT JOIN users u1 ON elt.created_by = u1.id
      LEFT JOIN users u2 ON elt.updated_by = u2.id
      WHERE elt.id = ?
      `,
      [id],
    );
    return row;
  },

  async findWithFilters(
    dbOrConn,
    { whereClause = "", values = [], orderClause = "ORDER BY elt.id DESC", limitClause = "" },
  ) {
    const db = dbOrConn || getDB();
    const query = `
      SELECT 
        elt.*,
        sc.name AS school_name,
        sc.code AS school_code,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM employee_leave_types elt
      LEFT JOIN schools sc ON elt.school_id = sc.id
      LEFT JOIN users u1 ON elt.created_by = u1.id
      LEFT JOIN users u2 ON elt.updated_by = u2.id
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
      FROM employee_leave_types elt
      LEFT JOIN schools sc ON elt.school_id = sc.id
      ${whereClause}
    `;
    const [[row]] = await db.query(query, values);
    return Number(row?.total || 0);
  },

  async update(conn, id, data) {
    await conn.query(`UPDATE employee_leave_types SET ? WHERE id = ?`, [
      data,
      id,
    ]);
  },

  async delete(conn, id) {
    const [res] = await conn.query(
      `DELETE FROM employee_leave_types WHERE id = ?`,
      [id],
    );
    return res;
  },
};
