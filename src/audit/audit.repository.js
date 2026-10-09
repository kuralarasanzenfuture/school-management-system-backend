import { getDB } from "../config/db.js";

/**
 * Audit Repository - Handles direct database operations for audit_logs and audit_log_changes
 */
export const auditRepository = {
  /**
   * Insert a new audit log record
   *
   * @param {object} logData
   * @param {import("mysql2/promise").Connection} [connection] - Optional existing transaction connection
   * @returns {Promise<number>} - Inserted audit_logs.id
   */
  async createAuditLog(logData, connection = null) {
    const db = connection || getDB();

    const sql = `
      INSERT INTO audit_logs (
        school_id,
        user_id,
        action,
        module,
        entity_type,
        entity_id,
        entity_name,
        description,
        old_data,
        new_data,
        change_data,
        request_id,
        request_method,
        request_url,
        ip_address,
        user_agent,
        device_type,
        device_name,
        operating_system,
        browser,
        status,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      logData.school_id || null,
      logData.user_id || null,
      logData.action,
      logData.module,
      logData.entity_type,
      logData.entity_id || null,
      logData.entity_name || null,
      logData.description || null,
      logData.old_data ? JSON.stringify(logData.old_data) : null,
      logData.new_data ? JSON.stringify(logData.new_data) : null,
      logData.change_data ? JSON.stringify(logData.change_data) : null,
      logData.request_id || null,
      logData.request_method || null,
      logData.request_url || null,
      logData.ip_address || null,
      logData.user_agent || null,
      logData.device_type || null,
      logData.device_name || null,
      logData.operating_system || null,
      logData.browser || null,
      logData.status || "success",
      logData.error_message || null,
    ];

    const [result] = await db.query(sql, values);
    return result.insertId;
  },

  /**
   * Batch insert field-level changes into audit_log_changes
   *
   * @param {number} auditLogId
   * @param {Array<object>} changes
   * @param {import("mysql2/promise").Connection} [connection]
   * @returns {Promise<void>}
   */
  async createAuditLogChanges(auditLogId, changes = [], connection = null) {
    if (!changes || changes.length === 0) return;

    const db = connection || getDB();

    const sql = `
      INSERT INTO audit_log_changes (
        audit_log_id,
        field_name,
        field_label,
        data_type,
        old_value,
        new_value
      ) VALUES ?
    `;

    const values = changes.map((c) => [
      auditLogId,
      c.field_name,
      c.field_label || null,
      c.data_type || null,
      c.old_value !== undefined ? c.old_value : null,
      c.new_value !== undefined ? c.new_value : null,
    ]);

    await db.query(sql, [values]);
  },

  /**
   * Retrieve audit logs with filters and pagination
   *
   * @param {object} filters
   * @returns {Promise<{ logs: Array<object>, total: number, page: number, limit: number }>}
   */
  async findAuditLogs(filters = {}) {
    const db = getDB();

    const {
      school_id,
      user_id,
      action,
      module,
      entity_type,
      entity_id,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "DESC",
    } = filters;

    const conditions = [];
    const params = [];

    if (school_id) {
      conditions.push("al.school_id = ?");
      params.push(school_id);
    }

    if (user_id) {
      conditions.push("al.user_id = ?");
      params.push(user_id);
    }

    if (action) {
      conditions.push("al.action = ?");
      params.push(action);
    }

    if (module) {
      conditions.push("al.module = ?");
      params.push(module);
    }

    if (entity_type) {
      conditions.push("al.entity_type = ?");
      params.push(entity_type);
    }

    if (entity_id) {
      conditions.push("al.entity_id = ?");
      params.push(entity_id);
    }

    if (status) {
      conditions.push("al.status = ?");
      params.push(status);
    }

    if (startDate) {
      conditions.push("al.created_at >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("al.created_at <= ?");
      params.push(endDate);
    }

    if (search) {
      conditions.push(
        "(al.entity_name LIKE ? OR al.description LIKE ? OR al.module LIKE ?)"
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult.total) || 0;

    // Sorting & pagination
    const allowedSort = ["id", "created_at", "action", "module", "status"];
    const sortCol = allowedSort.includes(sortBy) ? `al.${sortBy}` : "al.id";
    const sortDir = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;

    const sql = `
      SELECT 
        al.*,
        u.email as user_email,
        u.username as user_username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const [logs] = await db.query(sql, [...params, parsedLimit, offset]);

    return {
      logs,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    };
  },

  /**
   * Retrieve a single audit log by ID with associated field changes
   *
   * @param {number|string} id
   * @returns {Promise<object | null>}
   */
  async findAuditLogById(id) {
    const db = getDB();

    const sql = `
      SELECT 
        al.*,
        u.email as user_email,
        u.username as user_username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `;

    const [[log]] = await db.query(sql, [id]);
    if (!log) return null;

    const [changes] = await db.query(
      `SELECT * FROM audit_log_changes WHERE audit_log_id = ? ORDER BY id ASC`,
      [id]
    );

    return {
      ...log,
      changes,
    };
  },
};

export default auditRepository;
