import { getDB } from "../../config/db.js";

export const SectionModel = {
  create: async (conn, data) => {
    const db = conn || getDB();
    const {
      class_id,
      name,
      capacity = null,
      status = "active",
      created_by = null,
    } = data;

    const [result] = await db.query(
      `INSERT INTO sections (class_id, name, capacity, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [class_id, name, capacity, status, created_by],
    );
    return result.insertId;
  },

  findById: async (id, connection = null) => {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        s.*,
        s.name AS section_name,
        c.id AS class_id,
        c.name AS class_name,
        c.school_id AS school_id,
        c.status AS class_status,
        sc.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name,
        CONCAT(c.name, ' - ', s.name) AS class_section
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      JOIN schools sc ON c.school_id = sc.id
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
      WHERE s.id = ?
      `,
      [id],
    );

    return row || null;
  },

  findDuplicate: async (class_id, name, excludeId = null, connection = null) => {
    const db = connection || getDB();

    let query = `
      SELECT id, class_id, name, status FROM sections
      WHERE class_id=? AND UPPER(name)=UPPER(?)
    `;

    const params = [class_id, name];

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
      class_id,
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

    if (class_id) {
      conditions.push("s.class_id = ?");
      params.push(class_id);
    }

    if (school_id) {
      conditions.push("c.school_id = ?");
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

    if (name) {
      conditions.push("s.name LIKE ?");
      params.push(`%${name}%`);
    }

    if (search) {
      conditions.push(
        "(s.name LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "s.id",
      name: "s.name",
      section_name: "s.name",
      capacity: "s.capacity",
      status: "s.status",
      class_id: "s.class_id",
      class_name: "c.name",
      school_id: "c.school_id",
      school_name: "sc.name",
      created_at: "s.created_at",
      updated_at: "s.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "s.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      JOIN schools sc ON c.school_id = sc.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT 
        s.*,
        s.name AS section_name,
        c.id AS class_id,
        c.name AS class_name,
        c.school_id AS school_id,
        sc.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name,
        CONCAT(c.name, ' - ', s.name) AS class_section
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      JOIN schools sc ON c.school_id = sc.id
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
      sections: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  getAllTreeData: async (school_id = null) => {
    const db = getDB();

    let query = `
      SELECT 
        sc.id AS school_id,
        sc.name AS school_name,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name
      FROM schools sc
      LEFT JOIN classes c ON c.school_id = sc.id
      LEFT JOIN sections s ON s.class_id = c.id
    `;
    const params = [];

    if (school_id) {
      query += ` WHERE sc.id = ?`;
      params.push(school_id);
    }

    query += ` ORDER BY sc.id, c.id, s.id`;

    const [rows] = await db.query(query, params);
    return rows;
  },

  getAllClassById: async (class_id) => {
    const db = getDB();

    const [rows] = await db.query(
      `
      SELECT 
        s.*,
        s.name AS section_name,
        c.id AS class_id,
        c.name AS class_name,
        c.school_id AS school_id,
        CONCAT(c.name, ' - ', s.name) AS class_section
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      WHERE s.class_id = ?
      ORDER BY s.name
      `,
      [class_id],
    );

    return rows;
  },

  update: async (conn, id, fields, values) => {
    const db = conn || getDB();
    const query = `UPDATE sections SET ${fields.join(", ")} WHERE id=?`;
    await db.query(query, [...values, id]);
  },

  delete: async (conn, id) => {
    const db = conn || getDB();
    const [result] = await db.query(`DELETE FROM sections WHERE id=?`, [id]);
    return result.affectedRows;
  },

  checkReferences: async (id, connection = null) => {
    const db = connection || getDB();

    const [[classSectionsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM class_sections WHERE section_id = ?`,
      [id],
    );

    const classSections = Number(classSectionsCount?.count) || 0;

    return {
      classSections,
      total: classSections,
    };
  },
};
