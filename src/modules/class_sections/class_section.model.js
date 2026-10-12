import { getDB } from "../../config/db.js";

export const ClassSectionModel = {
  async create(conn, data) {
    const db = conn || getDB();
    const {
      school_id,
      class_id,
      section_id,
      academic_year_id,
      class_teacher_id = null,
      capacity = null,
      status = "active",
      created_by = null,
    } = data;

    const [res] = await db.query(
      `
      INSERT INTO class_sections
      (school_id, class_id, section_id, academic_year_id,
       class_teacher_id, capacity, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        school_id,
        class_id,
        section_id,
        academic_year_id,
        class_teacher_id,
        capacity,
        status,
        created_by,
      ],
    );

    return res.insertId;
  },

  async findDuplicate(conn, data, excludeId = null) {
    const db = conn || getDB();

    let query = `
      SELECT id FROM class_sections
      WHERE school_id=?
        AND class_id=?
        AND section_id=?
        AND academic_year_id=?
    `;
    const params = [
      data.school_id,
      data.class_id,
      data.section_id,
      data.academic_year_id,
    ];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [[row]] = await db.query(query, params);
    return row || null;
  },

  async findById(id, connection = null) {
    const db = connection || getDB();

    const [[row]] = await db.query(
      `
      SELECT 
        cs.*,
        sc.name AS school_name,
        c.name AS class_name,
        s.name AS section_name,
        ay.name AS academic_year,
        TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))) AS class_teacher_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name,
        CONCAT(c.name, ' - ', s.name) AS class_section
      FROM class_sections cs
      JOIN schools sc ON cs.school_id = sc.id
      JOIN classes c ON cs.class_id = c.id
      JOIN sections s ON cs.section_id = s.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      LEFT JOIN employees e ON cs.class_teacher_id = e.id
      LEFT JOIN users u1 ON cs.created_by = u1.id
      LEFT JOIN users u2 ON cs.updated_by = u2.id
      WHERE cs.id = ?
      `,
      [id],
    );

    return row || null;
  },

  async update(conn, id, fields, values) {
    const db = conn || getDB();
    await db.query(
      `UPDATE class_sections SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async findAll(filters = {}) {
    const db = getDB();
    const {
      school_id,
      class_id,
      section_id,
      academic_year_id,
      class_teacher_id,
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "DESC",
      paginate = true,
    } = filters;

    const conditions = [];
    const params = [];

    if (school_id) {
      conditions.push("cs.school_id = ?");
      params.push(school_id);
    }

    if (class_id) {
      conditions.push("cs.class_id = ?");
      params.push(class_id);
    }

    if (section_id) {
      conditions.push("cs.section_id = ?");
      params.push(section_id);
    }

    if (academic_year_id) {
      conditions.push("cs.academic_year_id = ?");
      params.push(academic_year_id);
    }

    if (class_teacher_id) {
      conditions.push("cs.class_teacher_id = ?");
      params.push(class_teacher_id);
    }

    if (status) {
      if (status === "none") {
        conditions.push("1 = 0");
      } else if (Array.isArray(status)) {
        if (status.length === 1) {
          conditions.push("cs.status = ?");
          params.push(status[0]);
        } else if (status.length > 1) {
          conditions.push(
            `cs.status IN (${status.map(() => "?").join(", ")})`,
          );
          params.push(...status);
        }
      } else {
        conditions.push("cs.status = ?");
        params.push(status);
      }
    }

    if (search) {
      conditions.push(
        "(c.name LIKE ? OR s.name LIKE ? OR sc.name LIKE ? OR ay.name LIKE ? OR CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) LIKE ?)",
      );
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "cs.id",
      school_name: "sc.name",
      class_name: "c.name",
      section_name: "s.name",
      academic_year: "ay.name",
      class_teacher_name: "e.first_name",
      capacity: "cs.capacity",
      status: "cs.status",
      created_at: "cs.created_at",
      updated_at: "cs.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "cs.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    const countSql = `
      SELECT COUNT(*) as total
      FROM class_sections cs
      JOIN schools sc ON cs.school_id = sc.id
      JOIN classes c ON cs.class_id = c.id
      JOIN sections s ON cs.section_id = s.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      LEFT JOIN employees e ON cs.class_teacher_id = e.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT
        cs.id,
        cs.school_id,
        sc.name AS school_name,
        cs.class_id,
        c.name AS class_name,
        cs.section_id,
        s.name AS section_name,
        cs.academic_year_id,
        ay.name AS academic_year,
        cs.class_teacher_id,
        TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))) AS class_teacher_name,
        cs.capacity,
        cs.status,
        cs.created_by,
        u1.username AS created_by_name,
        cs.updated_by,
        u2.username AS updated_by_name,
        cs.created_at,
        cs.updated_at,
        CONCAT(c.name, ' - ', s.name) AS class_section
      FROM class_sections cs
      JOIN schools sc ON cs.school_id = sc.id
      JOIN classes c ON cs.class_id = c.id
      JOIN sections s ON cs.section_id = s.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      LEFT JOIN employees e ON cs.class_teacher_id = e.id
      LEFT JOIN users u1 ON cs.created_by = u1.id
      LEFT JOIN users u2 ON cs.updated_by = u2.id
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
      classSections: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async delete(conn, id) {
    const db = conn || getDB();
    const [result] = await db.query(`DELETE FROM class_sections WHERE id=?`, [id]);
    return result.affectedRows;
  },

  async checkReferences(id, connection = null) {
    const db = connection || getDB();

    const [[classSubjectsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM class_subjects WHERE class_section_id = ?`,
      [id],
    );

    const [[attendanceSessionsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM student_attendance_sessions WHERE class_section_id = ?`,
      [id],
    );

    const classSubjects = Number(classSubjectsCount?.count) || 0;
    const attendanceSessions = Number(attendanceSessionsCount?.count) || 0;

    return {
      classSubjects,
      attendanceSessions,
      total: classSubjects + attendanceSessions,
    };
  },
};
