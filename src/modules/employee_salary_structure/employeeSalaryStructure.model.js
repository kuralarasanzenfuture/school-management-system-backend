import { getDB } from "../../config/db.js";

export const SalaryStructureModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_salary_structures
      (school_id, employee_id, structure_name, effective_from, effective_to, status, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.employee_id,
        data.structure_name,
        data.effective_from,
        data.effective_to,
        data.status,
        data.remarks,
        data.created_by,
      ],
    );

    return res.insertId;
  },

  async findById(dbOrConn, id) {
    const db = dbOrConn || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        ess.*,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.designation,
        e.department,
        e.photo_url,
        e.passport_size_photo_url,
        sc.name AS school_name,
        sc.code AS school_code,
        u.username AS created_by_username
      FROM employee_salary_structures ess
      LEFT JOIN employees e ON ess.employee_id = e.id
      LEFT JOIN schools sc ON ess.school_id = sc.id
      LEFT JOIN users u ON ess.created_by = u.id
      WHERE ess.id = ?
      `,
      [id],
    );
    return row;
  },

  async findWithFilters(
    dbOrConn,
    {
      whereClause = "",
      values = [],
      orderClause = "ORDER BY ess.id DESC",
      limitClause = "",
    },
  ) {
    const db = dbOrConn || getDB();
    const query = `
      SELECT 
        ess.*,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.designation,
        e.department,
        e.photo_url,
        e.passport_size_photo_url,
        sc.name AS school_name,
        sc.code AS school_code,
        u.username AS created_by_username
      FROM employee_salary_structures ess
      LEFT JOIN employees e ON ess.employee_id = e.id
      LEFT JOIN schools sc ON ess.school_id = sc.id
      LEFT JOIN users u ON ess.created_by = u.id
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
      FROM employee_salary_structures ess
      LEFT JOIN employees e ON ess.employee_id = e.id
      LEFT JOIN schools sc ON ess.school_id = sc.id
      LEFT JOIN users u ON ess.created_by = u.id
      ${whereClause}
    `;
    const [[row]] = await db.query(query, values);
    return Number(row?.total || 0);
  },

  async update(conn, id, fieldsOrData, values = null) {
    if (Array.isArray(fieldsOrData) && Array.isArray(values)) {
      await conn.query(
        `UPDATE employee_salary_structures SET ${fieldsOrData.join(", ")} WHERE id=?`,
        [...values, id],
      );
    } else {
      await conn.query(`UPDATE employee_salary_structures SET ? WHERE id=?`, [
        fieldsOrData,
        id,
      ]);
    }
  },

  async updateStatus(conn, id, status) {
    await conn.query(
      `UPDATE employee_salary_structures SET status = ? WHERE id = ?`,
      [status, id],
    );
  },

  async countDetails(connOrDb, structureId) {
    const db = connOrDb || getDB();
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS total FROM employee_salary_structure_details WHERE salary_structure_id = ?`,
      [structureId],
    );
    return Number(row?.total || 0);
  },

  async countPayrollReferences(connOrDb, structureId) {
    try {
      const db = connOrDb || getDB();
      const [[row]] = await db.query(
        `SELECT COUNT(*) AS total FROM employee_payroll WHERE salary_structure_id = ?`,
        [structureId],
      );
      return Number(row?.total || 0);
    } catch (err) {
      return 0;
    }
  },

  async delete(conn, id) {
    const [res] = await conn.query(
      `DELETE FROM employee_salary_structures WHERE id = ?`,
      [id],
    );
    return res;
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        ess.*,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.designation,
        e.department,
        e.photo_url,
        e.passport_size_photo_url,
        sc.name AS school_name,
        sc.code AS school_code,
        u.username AS created_by_username
      FROM employee_salary_structures ess
      LEFT JOIN employees e ON ess.employee_id = e.id
      LEFT JOIN schools sc ON ess.school_id = sc.id
      LEFT JOIN users u ON ess.created_by = u.id
      ORDER BY ess.id DESC
    `);

    return rows;
  },
};
