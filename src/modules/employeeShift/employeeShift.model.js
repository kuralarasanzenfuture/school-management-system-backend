import { getDB } from "../../config/db.js";

export const EmployeeShiftModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO employee_shifts SET ?`,
      [data]
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

  async findById(dbOrConn, id) {
    const db = dbOrConn || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        es.*,
        sc.name AS school_name,
        sc.code AS school_code,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM employee_shifts es
      LEFT JOIN schools sc ON es.school_id = sc.id
      LEFT JOIN users u1 ON es.created_by = u1.id
      LEFT JOIN users u2 ON es.updated_by = u2.id
      WHERE es.id=?
      `,
      [id],
    );
    return row;
  },

  async findWithFilters(
    dbOrConn,
    { whereClause = "", values = [], orderClause = "ORDER BY es.id DESC", limitClause = "" }
  ) {
    const db = dbOrConn || getDB();
    const query = `
      SELECT 
        es.*,
        sc.name AS school_name,
        sc.code AS school_code,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM employee_shifts es
      LEFT JOIN schools sc ON es.school_id = sc.id
      LEFT JOIN users u1 ON es.created_by = u1.id
      LEFT JOIN users u2 ON es.updated_by = u2.id
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
      FROM employee_shifts es
      LEFT JOIN schools sc ON es.school_id = sc.id
      ${whereClause}
    `;
    const [[row]] = await db.query(query, values);
    return Number(row?.total || 0);
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        es.*,
        sc.id AS school_id,
        sc.name AS school_name,
        sc.code AS school_code,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM employee_shifts es
      LEFT JOIN schools sc ON es.school_id = sc.id
      LEFT JOIN users u1 ON es.created_by = u1.id
      LEFT JOIN users u2 ON es.updated_by = u2.id
      ORDER BY es.id DESC
    `);
    return rows;
  },

  async update(conn, id, data) {
    await conn.query(`UPDATE employee_shifts SET ? WHERE id=?`, [data, id]);
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM employee_shifts WHERE id=?`, [id]);
  },
};
