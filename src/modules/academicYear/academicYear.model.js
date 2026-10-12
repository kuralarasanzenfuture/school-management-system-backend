import { getDB } from "../../config/db.js";

export const AcademicYearModel = {
  create: async (conn, data) => {
    const db = conn || getDB();
    const {
      school_id,
      name,
      start_date,
      end_date,
      status = "active",
      remarks = null,
      created_by = null,
    } = data;

    const [result] = await db.query(
      `
      INSERT INTO academic_years
      (school_id, name, start_date, end_date, status, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [school_id, name, start_date, end_date, status, remarks, created_by],
    );

    return result.insertId;
  },

  findById: async (id, connection = null) => {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT
        ay.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM academic_years ay
      LEFT JOIN schools s ON ay.school_id = s.id
      LEFT JOIN users u1 ON ay.created_by = u1.id
      LEFT JOIN users u2 ON ay.updated_by = u2.id
      WHERE ay.id = ?
      `,
      [id],
    );
    return row || null;
  },

  findDuplicate: async (school_id, name, excludeId = null, connection = null) => {
    const db = connection || getDB();

    let query = `
      SELECT id, school_id, name, status FROM academic_years
      WHERE school_id = ? AND UPPER(name) = UPPER(?)
    `;
    const params = [school_id, name];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows.length ? rows[0] : null;
  },

  checkOverlap: async (school_id, start_date, end_date, excludeId = null, connection = null) => {
    const db = connection || getDB();

    let query = `
      SELECT id, name, start_date, end_date FROM academic_years
      WHERE school_id = ?
        AND (start_date <= ? AND end_date >= ?)
    `;
    const params = [school_id, end_date, start_date];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  findAll: async (filters = {}) => {
    const db = getDB();
    const {
      school_id,
      status,
      search,
      name,
      page = 1,
      limit = 20,
      sortBy = "start_date",
      sortOrder = "DESC",
      paginate = true,
    } = filters;

    const conditions = [];
    const params = [];

    if (school_id) {
      conditions.push("ay.school_id = ?");
      params.push(school_id);
    }

    if (status) {
      if (Array.isArray(status)) {
        if (status.length === 1) {
          conditions.push("ay.status = ?");
          params.push(status[0]);
        } else if (status.length > 1) {
          conditions.push(`ay.status IN (${status.map(() => "?").join(", ")})`);
          params.push(...status);
        }
      } else {
        conditions.push("ay.status = ?");
        params.push(status);
      }
    }

    if (name) {
      conditions.push("ay.name LIKE ?");
      params.push(`%${name}%`);
    }

    if (search) {
      conditions.push("(ay.name LIKE ? OR ay.remarks LIKE ? OR s.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "ay.id",
      name: "ay.name",
      start_date: "ay.start_date",
      end_date: "ay.end_date",
      status: "ay.status",
      school_id: "ay.school_id",
      school_name: "s.name",
      created_at: "ay.created_at",
      updated_at: "ay.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "ay.start_date";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM academic_years ay
      LEFT JOIN schools s ON ay.school_id = s.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT
        ay.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM academic_years ay
      LEFT JOIN schools s ON ay.school_id = s.id
      LEFT JOIN users u1 ON ay.created_by = u1.id
      LEFT JOIN users u2 ON ay.updated_by = u2.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
    `;

    const queryParams = [...params];

    if (paginate) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
    }

    const [rows] = await db.query(sql, queryParams);

    return {
      academicYears: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  update: async (conn, id, fields, values) => {
    const db = conn || getDB();
    await db.query(`UPDATE academic_years SET ${fields.join(", ")} WHERE id=?`, [
      ...values,
      id,
    ]);
  },

  delete: async (conn, id) => {
    const db = conn || getDB();
    const [result] = await db.query(`DELETE FROM academic_years WHERE id=?`, [id]);
    return result.affectedRows;
  },

  checkReferences: async (id, connection = null) => {
    const db = connection || getDB();

    const [[classSectionsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM class_sections WHERE academic_year_id = ?`,
      [id],
    );

    const [[studentsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM student_admissions WHERE academic_year_id = ?`,
      [id],
    );

    const classSections = Number(classSectionsCount?.count) || 0;
    const students = Number(studentsCount?.count) || 0;

    return {
      classSections,
      students,
      total: classSections + students,
    };
  },
};