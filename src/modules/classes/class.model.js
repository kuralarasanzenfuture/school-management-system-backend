import { getDB } from "../../config/db.js";

export const ClassModel = {
  create: async (conn, data) => {
    const db = conn || getDB();
    const { school_id, name, status = "active", created_by = null } = data;
    const [result] = await db.query(
      `INSERT INTO classes (school_id, name, status, created_by)
       VALUES (?, ?, ?, ?)`,
      [school_id, name, status, created_by],
    );

    return result.insertId;
  },

  findById: async (id, connection = null) => {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `SELECT
        c.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
       FROM classes c
       LEFT JOIN schools s ON c.school_id = s.id
       LEFT JOIN users u1 ON c.created_by = u1.id
       LEFT JOIN users u2 ON c.updated_by = u2.id
       WHERE c.id = ?`,
      [id],
    );
    return row || null;
  },

  findDuplicate: async (school_id, name, excludeId = null, connection = null) => {
    const db = connection || getDB();

    let query = `
      SELECT id, school_id, name, status FROM classes
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

  findAll: async (filters = {}) => {
    const db = getDB();
    const {
      school_id,
      status,
      search,
      name,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "DESC",
      paginate = true,
    } = filters;

    const conditions = [];
    const params = [];

    if (school_id) {
      conditions.push("c.school_id = ?");
      params.push(school_id);
    }

    if (status) {
      if (Array.isArray(status)) {
        if (status.length === 1) {
          conditions.push("c.status = ?");
          params.push(status[0]);
        } else if (status.length > 1) {
          conditions.push(`c.status IN (${status.map(() => "?").join(", ")})`);
          params.push(...status);
        }
      } else {
        conditions.push("c.status = ?");
        params.push(status);
      }
    }

    if (name) {
      conditions.push("c.name LIKE ?");
      params.push(`%${name}%`);
    }

    if (search) {
      conditions.push("(c.name LIKE ? OR s.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "c.id",
      name: "c.name",
      status: "c.status",
      school_id: "c.school_id",
      school_name: "s.name",
      created_at: "c.created_at",
      updated_at: "c.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "c.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM classes c
      LEFT JOIN schools s ON c.school_id = s.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT
        c.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM classes c
      LEFT JOIN schools s ON c.school_id = s.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
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
      classes: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  getAllBySchool: async (school_id) => {
    return await ClassModel.findAll({ school_id, paginate: false });
  },

  getAll: async (school_id = null) => {
    return await ClassModel.findAll({ school_id, paginate: false });
  },

  update: async (conn, id, fields, values) => {
    const db = conn || getDB();
    const query = `UPDATE classes SET ${fields.join(", ")} WHERE id=?`;
    await db.query(query, [...values, id]);
  },

  delete: async (conn, id) => {
    const db = conn || getDB();
    const [result] = await db.query(`DELETE FROM classes WHERE id=?`, [id]);
    return result.affectedRows;
  },

  checkReferences: async (id, connection = null) => {
    const db = connection || getDB();

    const [[sectionsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM sections WHERE class_id = ?`,
      [id],
    );

    const [[studentsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM student_admissions WHERE class_id = ?`,
      [id],
    );

    const [[classSectionsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM class_sections WHERE class_id = ?`,
      [id],
    );

    return {
      sections: Number(sectionsCount?.count) || 0,
      students: Number(studentsCount?.count) || 0,
      classSections: Number(classSectionsCount?.count) || 0,
      total:
        (Number(sectionsCount?.count) || 0) +
        (Number(studentsCount?.count) || 0) +
        (Number(classSectionsCount?.count) || 0),
    };
  },
};
