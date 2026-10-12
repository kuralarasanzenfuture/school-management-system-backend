import { getDB } from "../../config/db.js";

export const SubjectGroupModel = {
  async create(conn, data) {
    const db = conn || getDB();
    const {
      school_id,
      name,
      description = null,
      status = "active",
      created_by = null,
    } = data;

    const [res] = await db.query(
      `
      INSERT INTO subject_groups 
      (school_id, name, description, status, created_by)
      VALUES (?, ?, ?, ?, ?)
      `,
      [school_id, name, description, status, created_by],
    );

    return res.insertId;
  },

  async findById(id, connection = null) {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        sg.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM subject_groups sg
      JOIN schools s ON sg.school_id = s.id
      LEFT JOIN users u1 ON sg.created_by = u1.id
      LEFT JOIN users u2 ON sg.updated_by = u2.id
      WHERE sg.id = ?
      `,
      [id],
    );
    return row || null;
  },

  async findDuplicate(conn, school_id, name, excludeId = null) {
    const db = conn || getDB();

    let query = `
      SELECT id, name FROM subject_groups
      WHERE school_id = ? AND UPPER(name) = UPPER(?)
    `;
    const params = [school_id, name];

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
      conditions.push("sg.school_id = ?");
      params.push(school_id);
    }

    if (status) {
      if (status === "none") {
        conditions.push("1 = 0");
      } else if (Array.isArray(status)) {
        if (status.length === 1) {
          conditions.push("sg.status = ?");
          params.push(status[0]);
        } else if (status.length > 1) {
          conditions.push(`sg.status IN (${status.map(() => "?").join(", ")})`);
          params.push(...status);
        }
      } else {
        conditions.push("sg.status = ?");
        params.push(status);
      }
    }

    if (name) {
      conditions.push("sg.name LIKE ?");
      params.push(`%${name}%`);
    }

    if (search) {
      conditions.push(
        "(sg.name LIKE ? OR sg.description LIKE ? OR s.name LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "sg.id",
      name: "sg.name",
      status: "sg.status",
      school_id: "sg.school_id",
      school_name: "s.name",
      created_at: "sg.created_at",
      updated_at: "sg.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "sg.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    const countSql = `
      SELECT COUNT(*) as total
      FROM subject_groups sg
      JOIN schools s ON sg.school_id = s.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT
        sg.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM subject_groups sg
      JOIN schools s ON sg.school_id = s.id
      LEFT JOIN users u1 ON sg.created_by = u1.id
      LEFT JOIN users u2 ON sg.updated_by = u2.id
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
      subjectGroups: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async update(conn, id, fields, values) {
    const db = conn || getDB();
    await db.query(`UPDATE subject_groups SET ${fields.join(", ")} WHERE id=?`, [
      ...values,
      id,
    ]);
  },

  async delete(conn, id) {
    const db = conn || getDB();
    const [result] = await db.query(`DELETE FROM subject_groups WHERE id=?`, [id]);
    return result.affectedRows;
  },

  async checkReferences(id, connection = null) {
    const db = connection || getDB();

    const [[classSubjectsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM class_subjects WHERE subject_group_id = ?`,
      [id],
    );

    const classSubjects = Number(classSubjectsCount?.count) || 0;

    return {
      classSubjects,
      total: classSubjects,
    };
  },
};
