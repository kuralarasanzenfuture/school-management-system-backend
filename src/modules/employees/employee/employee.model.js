import { getDB } from "../../../config/db.js";

// export const EmployeeModel = {
//   create: async (conn, data) => {
//     const [result] = await conn.query(`INSERT INTO employees SET ?`, [data]);
//     return result.insertId;
//   },

//   findAll: async () => {
//     const db = getDB();
//     const [rows] = await db.query(`SELECT * FROM employees`);
//     return rows;
//   },

//   findById: async (id) => {
//     const db = getDB();
//     const [[row]] = await db.query(`SELECT * FROM employees WHERE id=?`, [id]);
//     return row;
//   },

//   update: async (conn, id, data) => {
//     await conn.query(`UPDATE employees SET ? WHERE id=?`, [data, id]);
//   },

//   delete: async (conn, id) => {
//     await conn.query(`DELETE FROM employees WHERE id=?`, [id]);
//   },
// };

/*===============================================*/

export const EmployeeModel = {
  /* =================================================================
     CREATE
     Uses the clean 'SET ?' mapping feature. Make sure your payload
     object fields match your MySQL table column names exactly.
  ================================================================= */
  async create(conn, data) {
    const [result] = await conn.query(`INSERT INTO employees SET ?`, [data]);
    return result.insertId;
  },

  /* =================================================================
     FIND ALL (WITH RELATIONS)
  ================================================================= */
  async findAll() {
    const db = getDB();
    const [rows] = await db.query(`
      SELECT 
        e.*,
        u.username,
        u.email AS user_email,
        u.status AS user_status,
        s.name AS school_name,
        s.code AS school_code
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      JOIN schools s ON e.school_id = s.id
      ORDER BY e.id DESC
    `);
    return rows;
  },

  /* =================================================================
     FIND WITH ADVANCED FILTERS
  ================================================================= */
  async findWithFilters(dbOrConn, { whereClause = "", values = [], orderClause = "ORDER BY e.id DESC", limitClause = "" }) {
    const query = `
      SELECT 
        e.*,
        u.username,
        u.email AS user_email,
        u.status AS user_status,
        s.name AS school_name,
        s.code AS school_code
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      JOIN schools s ON e.school_id = s.id
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `;
    const [rows] = await dbOrConn.query(query, values);
    return rows;
  },

  /* =================================================================
     COUNT WITH FILTERS
  ================================================================= */
  async countWithFilters(dbOrConn, { whereClause = "", values = [] }) {
    const query = `
      SELECT COUNT(*) AS total
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      JOIN schools s ON e.school_id = s.id
      ${whereClause}
    `;
    const [[row]] = await dbOrConn.query(query, values);
    return Number(row?.total || 0);
  },

  /* =================================================================
     DISTINCT FILTER OPTIONS
  ================================================================= */
  async getFilterOptions(dbOrConn, schoolId = null) {
    const params = [];
    let schoolCondition = "";
    if (schoolId) {
      schoolCondition = "WHERE e.school_id = ?";
      params.push(schoolId);
    }

    const [designations] = await dbOrConn.query(
      `SELECT DISTINCT e.designation FROM employees e ${schoolCondition} ORDER BY e.designation ASC`,
      params
    );

    const [departments] = await dbOrConn.query(
      `SELECT DISTINCT e.department FROM employees e ${schoolCondition ? schoolCondition + " AND e.department IS NOT NULL" : "WHERE e.department IS NOT NULL"} ORDER BY e.department ASC`,
      params
    );

    const [bloodGroups] = await dbOrConn.query(
      `SELECT DISTINCT e.blood_group FROM employees e ${schoolCondition ? schoolCondition + " AND e.blood_group IS NOT NULL" : "WHERE e.blood_group IS NOT NULL"} ORDER BY e.blood_group ASC`,
      params
    );

    const [cities] = await dbOrConn.query(
      `SELECT DISTINCT e.current_city FROM employees e ${schoolCondition ? schoolCondition + " AND e.current_city IS NOT NULL" : "WHERE e.current_city IS NOT NULL"} ORDER BY e.current_city ASC`,
      params
    );

    const [[ranges]] = await dbOrConn.query(
      `SELECT 
        MIN(e.salary) AS min_salary, 
        MAX(e.salary) AS max_salary, 
        MIN(e.experience_years) AS min_experience, 
        MAX(e.experience_years) AS max_experience 
      FROM employees e ${schoolCondition}`,
      params
    );

    return {
      designations: designations.map((d) => d.designation).filter(Boolean),
      departments: departments.map((d) => d.department).filter(Boolean),
      genders: ["male", "female", "other"],
      blood_groups: bloodGroups.map((b) => b.blood_group).filter(Boolean),
      statuses: ["active", "inactive", "resigned", "terminated"],
      cities: cities.map((c) => c.current_city).filter(Boolean),
      salary_range: {
        min: Number(ranges?.min_salary || 0),
        max: Number(ranges?.max_salary || 0),
      },
      experience_range: {
        min: Number(ranges?.min_experience || 0),
        max: Number(ranges?.max_experience || 0),
      },
    };
  },

  /* =================================================================
     EMPLOYEE AGGREGATE STATS
  ================================================================= */
  async getStats(dbOrConn, schoolId = null) {
    const params = [];
    let schoolCondition = "";
    if (schoolId) {
      schoolCondition = "WHERE e.school_id = ?";
      params.push(schoolId);
    }

    const [[overview]] = await dbOrConn.query(
      `SELECT 
        COUNT(*) AS total_employees,
        SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) AS active_employees,
        SUM(CASE WHEN e.status = 'inactive' THEN 1 ELSE 0 END) AS inactive_employees,
        SUM(CASE WHEN e.status = 'resigned' THEN 1 ELSE 0 END) AS resigned_employees,
        SUM(CASE WHEN e.status = 'terminated' THEN 1 ELSE 0 END) AS terminated_employees,
        SUM(CASE WHEN e.user_id IS NOT NULL THEN 1 ELSE 0 END) AS assigned_users,
        SUM(CASE WHEN e.user_id IS NULL THEN 1 ELSE 0 END) AS unassigned_users,
        SUM(CASE WHEN e.gender = 'male' THEN 1 ELSE 0 END) AS male_count,
        SUM(CASE WHEN e.gender = 'female' THEN 1 ELSE 0 END) AS female_count,
        SUM(CASE WHEN e.gender = 'other' THEN 1 ELSE 0 END) AS other_gender_count,
        AVG(e.salary) AS average_salary,
        AVG(e.experience_years) AS average_experience
      FROM employees e ${schoolCondition}`,
      params
    );

    const [deptCounts] = await dbOrConn.query(
      `SELECT e.department, COUNT(*) AS count 
       FROM employees e 
       ${schoolCondition ? schoolCondition + " AND e.department IS NOT NULL" : "WHERE e.department IS NOT NULL"} 
       GROUP BY e.department 
       ORDER BY count DESC`,
      params
    );

    const [desigCounts] = await dbOrConn.query(
      `SELECT e.designation, COUNT(*) AS count 
       FROM employees e 
       ${schoolCondition} 
       GROUP BY e.designation 
       ORDER BY count DESC`,
      params
    );

    return {
      total: Number(overview?.total_employees || 0),
      status_counts: {
        active: Number(overview?.active_employees || 0),
        inactive: Number(overview?.inactive_employees || 0),
        resigned: Number(overview?.resigned_employees || 0),
        terminated: Number(overview?.terminated_employees || 0),
      },
      user_assignment: {
        assigned: Number(overview?.assigned_users || 0),
        unassigned: Number(overview?.unassigned_users || 0),
      },
      gender_counts: {
        male: Number(overview?.male_count || 0),
        female: Number(overview?.female_count || 0),
        other: Number(overview?.other_gender_count || 0),
      },
      averages: {
        salary: Number(overview?.average_salary || 0).toFixed(2),
        experience_years: Number(overview?.average_experience || 0).toFixed(1),
      },
      department_counts: deptCounts,
      designation_counts: desigCounts,
    };
  },

  /* =================================================================
     FIND BY ID (DETAILED)
     Fixed context: Uses standard 'conn/db' instance parameter passed 
     consistently down from the parent controller route layer.
  ================================================================= */
  async findById(conn, id) {
    const [[row]] = await conn.query(
      `
      SELECT 
        e.*,
        u.username,
        u.email AS user_email,
        s.name AS school_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      JOIN schools s ON e.school_id = s.id
      WHERE e.id = ?
    `,
      [id],
    );
    return row;
  },

  /* =================================================================
     LOCKED FETCH (FOR UPDATE)
  ================================================================= */
  async findByIdForUpdate(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employees WHERE id = ? FOR UPDATE`,
      [id],
    );
    return row;
  },

  /* =================================================================
     FIND BY USER
  ================================================================= */
  async findByUserId(conn, user_id) {
    const [[row]] = await conn.query(
      `SELECT id, user_id FROM employees WHERE user_id = ?`,
      [user_id],
    );
    return row;
  },

  /* =================================================================
     UPDATE (SAFE)
  ================================================================= */
  async update(conn, id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (!fields.length) return;

    values.push(id);

    await conn.query(
      `
      UPDATE employees
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values,
    );
  },

  /* =================================================================
     DELETE
  ================================================================= */
  async delete(conn, id) {
    await conn.query(`DELETE FROM employees WHERE id = ?`, [id]);
  },

  /* =================================================================
     ASSIGN USER / UNASSIGN USER
  ================================================================= */
  async assignUser(conn, employee_id, user_id) {
    await conn.query(`UPDATE employees SET user_id = ? WHERE id = ?`, [
      user_id,
      employee_id,
    ]);
  },

  async unassignUser(conn, employee_id) {
    await conn.query(`UPDATE employees SET user_id = NULL WHERE id = ?`, [
      employee_id,
    ]);
  },
};

/*==================================================================================================*/

// export const EmployeeDocumentModel = {
//   createBulk: async (conn, docs) => {
//     if (!docs.length) return;

//     const values = docs.map((d) => [
//       d.employee_id,
//       d.document_type,
//       d.file_name,
//       d.file_url,
//     ]);

//     await conn.query(
//       `INSERT INTO employee_documents
//       (employee_id, document_type, file_name, file_url)
//       VALUES ?`,
//       [values],
//     );
//   },
// };

/*==================================================================================================*/

export const EmployeeDocumentModel = {
  async createBulk(conn, docs) {
    if (!Array.isArray(docs) || docs.length === 0) return;

    const values = docs.map((d) => [
      d.employee_id,
      d.document_type,
      d.file_name,
      d.file_url,
    ]);

    await conn.query(
      `
      INSERT INTO employee_documents
      (employee_id, document_type, file_name, file_url)
      VALUES ?
      `,
      [values],
    );
  },

  async findByEmployeeId(db, employee_id) {
    const [rows] = await db.query(
      `SELECT * FROM employee_documents WHERE employee_id=?`,
      [employee_id],
    );
    return rows;
  },

  async deleteByEmployeeId(conn, employee_id) {
    await conn.query(`DELETE FROM employee_documents WHERE employee_id=?`, [
      employee_id,
    ]);
  },
};
