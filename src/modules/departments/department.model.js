import { getDB } from "../../config/db.js";

export const DepartmentModel = {
  async create(connection, data) {
    const db = connection || getDB();
    const {
      school_id,
      name,
      description = null,
      status = "active",
      created_by = null,
    } = data;

    const [result] = await db.query(
      `
      INSERT INTO departments (school_id, name, description, status, created_by)
      VALUES (?, ?, ?, ?, ?)
      `,
      [school_id, name, description, status, created_by],
    );

    return result.insertId;
  },

  async findById(id, connection = null) {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT
        d.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM departments d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.updated_by = u2.id
      WHERE d.id = ?
      `,
      [id],
    );
    return row || null;
  },

  async findDuplicate(school_id, name, excludeId = null, connection = null) {
    const db = connection || getDB();

    let query = `
      SELECT id, school_id, name FROM departments
      WHERE school_id = ? AND UPPER(name) = UPPER(?)
    `;

    const params = [school_id, name];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows.length ? rows[0] : null;
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
      conditions.push("d.school_id = ?");
      params.push(school_id);
    }

    if (status) {
      conditions.push("d.status = ?");
      params.push(status);
    }

    if (name) {
      conditions.push("d.name LIKE ?");
      params.push(`%${name}%`);
    }

    if (search) {
      conditions.push(
        "(d.name LIKE ? OR d.description LIKE ? OR s.name LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "d.id",
      name: "d.name",
      status: "d.status",
      school_id: "d.school_id",
      created_at: "d.created_at",
      updated_at: "d.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "d.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM departments d
      LEFT JOIN schools s ON d.school_id = s.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT
        d.*,
        s.name AS school_name,
        u1.username AS created_by_name,
        u2.username AS updated_by_name
      FROM departments d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.updated_by = u2.id
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
      departments: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async getAll() {
    return await this.findAll({ paginate: false });
  },

  async getBySchool(school_id) {
    return await this.findAll({ school_id, paginate: false });
  },

  async update(connection, id, fields, values) {
    const db = connection || getDB();
    await db.query(
      `UPDATE departments SET ${fields.join(", ")} WHERE id = ?`,
      [...values, id],
    );
  },

  async delete(connection, id) {
    const db = connection || getDB();
    const [result] = await db.query(`DELETE FROM departments WHERE id = ?`, [id]);
    return result.affectedRows;
  },
};
