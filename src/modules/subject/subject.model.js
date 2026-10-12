import { getDB } from "../../config/db.js";

export const SubjectModel = {
  async create(conn, data) {
    const db = conn || getDB();
    const {
      school_id,
      name,
      code = null,
      subject_type = "theory",
      status = "active",
      created_by = null,
    } = data;

    const [res] = await db.query(
      `
      INSERT INTO subjects 
      (school_id, name, code, subject_type, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [school_id, name, code, subject_type, status, created_by],
    );

    return res.insertId;
  },

  async findById(id, connection = null) {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        s.*,
        sc.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM subjects s
      JOIN schools sc ON s.school_id = sc.id
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
      WHERE s.id = ?
      `,
      [id],
    );
    return row || null;
  },

  async findDuplicate(conn, school_id, name, code = null, excludeId = null) {
    const db = conn || getDB();

    let query = `
      SELECT id, name, code FROM subjects
      WHERE school_id = ?
        AND (UPPER(name) = UPPER(?) OR (? IS NOT NULL AND code IS NOT NULL AND UPPER(code) = UPPER(?)))
    `;
    const params = [school_id, name, code, code];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [[row]] = await db.query(query, params);
    return row || null;
  },

  async findAll(filters = {}) {
    const db = getDB();
    const {
      school_id,
      status,
      subject_type,
      search,
      name,
      code,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "DESC",
      paginate = true,
    } = filters;

    const conditions = [];
    const params = [];

    if (school_id) {
      conditions.push("s.school_id = ?");
      params.push(school_id);
    }

    if (status) {
      if (status === "none") {
        conditions.push("1 = 0");
      } else if (Array.isArray(status)) {
        if (status.length === 1) {
          conditions.push("s.status = ?");
          params.push(status[0]);
        } else if (status.length > 1) {
          conditions.push(`s.status IN (${status.map(() => "?").join(", ")})`);
          params.push(...status);
        }
      } else {
        conditions.push("s.status = ?");
        params.push(status);
      }
    }

    if (subject_type) {
      conditions.push("s.subject_type = ?");
      params.push(subject_type);
    }

    if (name) {
      conditions.push("s.name LIKE ?");
      params.push(`%${name}%`);
    }

    if (code) {
      conditions.push("s.code LIKE ?");
      params.push(`%${code}%`);
    }

    if (search) {
      conditions.push(
        "(s.name LIKE ? OR s.code LIKE ? OR sc.name LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "s.id",
      name: "s.name",
      code: "s.code",
      subject_type: "s.subject_type",
      status: "s.status",
      school_id: "s.school_id",
      school_name: "sc.name",
      created_at: "s.created_at",
      updated_at: "s.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "s.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    const countSql = `
      SELECT COUNT(*) as total
      FROM subjects s
      JOIN schools sc ON s.school_id = sc.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT
        s.*,
        sc.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM subjects s
      JOIN schools sc ON s.school_id = sc.id
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
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
      subjects: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async update(conn, id, fields, values) {
    const db = conn || getDB();
    await db.query(`UPDATE subjects SET ${fields.join(", ")} WHERE id=?`, [
      ...values,
      id,
    ]);
  },

  async delete(conn, id) {
    const db = conn || getDB();
    const [result] = await db.query(`DELETE FROM subjects WHERE id=?`, [id]);
    return result.affectedRows;
  },

  async checkReferences(id, connection = null) {
    const db = connection || getDB();

    const [[classSubjectsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM class_subjects WHERE subject_id = ?`,
      [id],
    );

    const classSubjects = Number(classSubjectsCount?.count) || 0;

    return {
      classSubjects,
      total: classSubjects,
    };
  },
};
