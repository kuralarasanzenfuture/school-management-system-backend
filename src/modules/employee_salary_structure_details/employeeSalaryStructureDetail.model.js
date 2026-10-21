import { getDB } from "../../config/db.js";

export const SalaryStructureDetailsModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_salary_structure_details
      (salary_structure_id, component_id, calculation_type, amount, percentage, based_on)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.salary_structure_id,
        data.component_id,
        data.calculation_type,
        data.amount,
        data.percentage,
        data.based_on,
      ],
    );

    return res.insertId;
  },

  async findDuplicate(conn, structureId, componentId, excludeId = null) {
    const [rows] = await conn.query(
      `
      SELECT id FROM employee_salary_structure_details
      WHERE salary_structure_id=? AND component_id=?
      ${excludeId ? "AND id != ?" : ""}
      `,
      excludeId
        ? [structureId, componentId, excludeId]
        : [structureId, componentId],
    );

    return rows[0];
  },

  async findById(dbOrConn, id) {
    const db = dbOrConn || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        d.*,
        s.structure_name,
        s.employee_id,
        s.school_id,
        s.status AS structure_status,
        c.name AS component_name,
        c.code AS component_code,
        c.component_type AS component_type,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.designation,
        e.photo_url,
        e.passport_size_photo_url,
        sc.name AS school_name,
        sc.code AS school_code
      FROM employee_salary_structure_details d
      JOIN employee_salary_structures s ON d.salary_structure_id = s.id
      JOIN employee_salary_components c ON d.component_id = c.id
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN schools sc ON s.school_id = sc.id
      WHERE d.id = ?
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
      orderClause = "ORDER BY d.id DESC",
      limitClause = "",
    },
  ) {
    const db = dbOrConn || getDB();
    const query = `
      SELECT 
        d.*,
        s.structure_name,
        s.employee_id,
        s.school_id,
        s.status AS structure_status,
        c.name AS component_name,
        c.code AS component_code,
        c.component_type AS component_type,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.designation,
        e.photo_url,
        e.passport_size_photo_url,
        sc.name AS school_name,
        sc.code AS school_code
      FROM employee_salary_structure_details d
      JOIN employee_salary_structures s ON d.salary_structure_id = s.id
      JOIN employee_salary_components c ON d.component_id = c.id
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN schools sc ON s.school_id = sc.id
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
      FROM employee_salary_structure_details d
      JOIN employee_salary_structures s ON d.salary_structure_id = s.id
      JOIN employee_salary_components c ON d.component_id = c.id
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN schools sc ON s.school_id = sc.id
      ${whereClause}
    `;
    const [[row]] = await db.query(query, values);
    return Number(row?.total || 0);
  },

  async update(conn, id, fieldsOrData, values = null) {
    if (Array.isArray(fieldsOrData) && Array.isArray(values)) {
      await conn.query(
        `UPDATE employee_salary_structure_details SET ${fieldsOrData.join(", ")} WHERE id=?`,
        [...values, id],
      );
    } else {
      await conn.query(
        `UPDATE employee_salary_structure_details SET ? WHERE id=?`,
        [fieldsOrData, id],
      );
    }
  },

  async delete(conn, id) {
    const [res] = await conn.query(
      `DELETE FROM employee_salary_structure_details WHERE id=?`,
      [id],
    );
    return res;
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        d.*,
        s.structure_name,
        s.employee_id,
        s.school_id,
        s.status AS structure_status,
        c.name AS component_name,
        c.code AS component_code,
        c.component_type AS component_type,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.designation,
        e.photo_url,
        e.passport_size_photo_url,
        sc.name AS school_name,
        sc.code AS school_code
      FROM employee_salary_structure_details d
      JOIN employee_salary_structures s ON d.salary_structure_id = s.id
      JOIN employee_salary_components c ON d.component_id = c.id
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN schools sc ON s.school_id = sc.id
      ORDER BY d.id DESC
    `);

    return rows;
  },
};
