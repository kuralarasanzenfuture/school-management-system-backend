import { getDB } from "../../config/db.js";

export const RoleModel = {
  /**
   * Insert new role
   */
  async create(roleData, connection = null) {
    const db = connection || getDB();
    const {
      name,
      role_code,
      description = null,
      is_system = 0,
      status = "active",
      created_by = null,
    } = roleData;

    const sql = `
      INSERT INTO roles (
        name,
        role_code,
        description,
        is_system,
        status,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      name,
      role_code,
      description,
      is_system,
      status,
      created_by,
    ]);

    return result.insertId;
  },

  /**
   * Find roles with filtering, search, sorting and pagination
   */
  async findAll(filters = {}) {
    const db = getDB();
    const {
      name,
      role_code,
      status,
      is_system,
      search,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "ASC",
      paginate = true,
    } = filters;

    const conditions = [];
    const params = [];

    if (name) {
      conditions.push("r.name = ?");
      params.push(name);
    }

    if (role_code) {
      conditions.push("r.role_code = ?");
      params.push(role_code);
    }

    if (status) {
      conditions.push("r.status = ?");
      params.push(status);
    }

    if (is_system !== null && is_system !== undefined) {
      conditions.push("r.is_system = ?");
      params.push(is_system);
    }

    if (search) {
      conditions.push("(r.name LIKE ? OR r.role_code LIKE ? OR r.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const allowedSort = ["id", "name", "role_code", "status", "is_system", "created_at"];
    const sortCol = allowedSort.includes(sortBy) ? `r.${sortBy}` : "r.id";
    const sortDir = String(sortOrder).toUpperCase() === "DESC" ? "DESC" : "ASC";

    if (!paginate) {
      const sql = `
        SELECT r.*,
          (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN users u ON ur.user_id = u.id WHERE ur.role_id = r.id AND u.status = 'active') as active_users_count
        FROM roles r
        ${whereClause}
        ORDER BY ${sortCol} ${sortDir}
      `;
      const [rows] = await db.query(sql, params);
      return { roles: rows, total: rows.length };
    }

    // Count
    const countSql = `SELECT COUNT(*) as total FROM roles r ${whereClause}`;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult.total) || 0;

    const offset = (page - 1) * limit;
    const sql = `
      SELECT r.*,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN users u ON ur.user_id = u.id WHERE ur.role_id = r.id AND u.status = 'active') as active_users_count
      FROM roles r
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, limit, offset]);

    return {
      roles: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Find role by ID
   */
  async findById(id, connection = null) {
    const db = connection || getDB();
    const [[role]] = await db.query(`SELECT * FROM roles WHERE id = ?`, [id]);
    return role || null;
  },

  /**
   * Find role by Name
   */
  async findByName(name, connection = null) {
    const db = connection || getDB();
    const [[role]] = await db.query(`SELECT * FROM roles WHERE name = ?`, [name]);
    return role || null;
  },

  /**
   * Find role by Role Code
   */
  async findByRoleCode(role_code, connection = null) {
    const db = connection || getDB();
    const [[role]] = await db.query(`SELECT * FROM roles WHERE role_code = ?`, [role_code]);
    return role || null;
  },

  /**
   * Update role fields dynamically
   */
  async update(id, fields = {}, connection = null) {
    const db = connection || getDB();

    const allowedFields = ["name", "role_code", "description", "status", "is_system", "updated_by"];
    const updates = [];
    const values = [];

    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) return;

    values.push(id);
    const sql = `UPDATE roles SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(sql, values);
  },

  /**
   * Delete role
   */
  async delete(id, connection = null) {
    const db = connection || getDB();
    await db.query(`DELETE FROM roles WHERE id = ?`, [id]);
  },

  /**
   * Count active assigned users for this role
   */
  async countAssignedUsers(roleId, connection = null) {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ?
        AND u.status = 'active'
      `,
      [roleId]
    );

    return Number(row?.count) || 0;
  },

  /**
   * Cascade update status to all users assigned to this role
   */
  async cascadeUsersStatus(roleId, status, connection = null) {
    const db = connection || getDB();
    await db.query(
      `
      UPDATE users u
      JOIN user_roles ur ON u.id = ur.user_id
      SET 
        u.status = ?,
        u.token_version = u.token_version + 1
      WHERE ur.role_id = ?
      `,
      [status, roleId]
    );
  },
};

export default RoleModel;
