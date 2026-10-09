import { auditRepository } from "./audit.repository.js";
import { AUDIT_ACTIONS, AUDIT_STATUS } from "./audit.constants.js";
import { sanitizeData } from "./audit.sanitizer.js";
import { calculateDiff, buildSnapshot } from "./audit.snapshot.js";
import { extractRequestInfo } from "../utils/request.js";

/**
 * Main Audit Service - Primary API for recording and retrieving audit logs
 */
export const auditService = {
  /**
   * Log an audit event
   *
   * @param {object} params
   * @param {import("express").Request} [params.req] - Express request object
   * @param {number|string} [params.school_id] - Target school ID
   * @param {number|string} [params.user_id] - User performing the action
   * @param {string} params.action - AUDIT_ACTIONS (CREATE, UPDATE, DELETE, etc.)
   * @param {string} params.module - Module name (e.g. 'roles', 'users')
   * @param {string} params.entity_type - Entity type (e.g. 'role', 'user')
   * @param {number|string} [params.entity_id] - Entity record ID
   * @param {string} [params.entity_name] - Name / identifier of record
   * @param {string} [params.description] - Description of the action
   * @param {object} [params.old_data] - Data snapshot before change
   * @param {object} [params.new_data] - Data snapshot after change
   * @param {Array<object>} [params.changes] - Pre-calculated changes
   * @param {string} [params.status='success'] - 'success' or 'failed'
   * @param {string} [params.error_message] - Error message if failed
   * @param {import("mysql2/promise").Connection} [params.connection] - Transaction connection
   * @returns {Promise<number | null>} - Created audit_log.id or null on failure
   */
  async log(params = {}) {
    try {
      const {
        req,
        action,
        module: auditModule,
        entity_type,
        entity_id,
        entity_name,
        description,
        old_data,
        new_data,
        status = AUDIT_STATUS.SUCCESS,
        error_message,
        connection,
      } = params;

      // Extract request metadata
      const reqInfo = extractRequestInfo(req);

      const school_id =
        params.school_id !== undefined ? params.school_id : reqInfo.school_id;
      const user_id =
        params.user_id !== undefined ? params.user_id : reqInfo.user_id;

      // Sanitize old and new data
      const sanitizedOld = old_data ? sanitizeData(old_data) : null;
      const sanitizedNew = new_data ? sanitizeData(new_data) : null;

      // Automatically calculate field diffs if both old and new data are available
      let changes = params.changes;
      let changeData = null;

      if (!changes && sanitizedOld && sanitizedNew) {
        const diffResult = calculateDiff(sanitizedOld, sanitizedNew);
        changes = diffResult.changes;
        changeData = diffResult.change_data;
      }

      // Build payload for audit_logs table
      const logPayload = {
        school_id,
        user_id,
        action: action || reqInfo.request_method,
        module: auditModule || "general",
        entity_type: entity_type || "unknown",
        entity_id: entity_id || null,
        entity_name: entity_name || null,
        description: description || null,
        old_data: sanitizedOld,
        new_data: sanitizedNew,
        change_data: changeData,
        request_id: reqInfo.request_id,
        request_method: reqInfo.request_method,
        request_url: reqInfo.request_url,
        ip_address: reqInfo.ip_address,
        user_agent: reqInfo.user_agent,
        device_type: reqInfo.device_type,
        device_name: reqInfo.device_name,
        operating_system: reqInfo.operating_system,
        browser: reqInfo.browser,
        status: status || AUDIT_STATUS.SUCCESS,
        error_message: error_message || null,
      };

      const auditLogId = await auditRepository.createAuditLog(logPayload, connection);

      // Insert field-level changes into audit_log_changes if any exist
      if (changes && changes.length > 0) {
        await auditRepository.createAuditLogChanges(auditLogId, changes, connection);
      }

      return auditLogId;
    } catch (err) {
      // Audit log failures should not crash user operations
      console.error("[AUDIT LOG FAILURE]:", err.message);
      return null;
    }
  },

  /**
   * Convenience method to log entity creation
   */
  async logCreate({
    req,
    module: auditModule,
    entity_type,
    entity_id,
    entity_name,
    description,
    new_data,
    connection,
    school_id,
    user_id,
  }) {
    return this.log({
      req,
      action: AUDIT_ACTIONS.CREATE,
      module: auditModule,
      entity_type,
      entity_id,
      entity_name,
      description: description || `Created ${entity_type} ${entity_name || entity_id || ""}`.trim(),
      old_data: null,
      new_data,
      connection,
      school_id,
      user_id,
    });
  },

  /**
   * Convenience method to log entity update with automatic diffing
   */
  async logUpdate({
    req,
    module: auditModule,
    entity_type,
    entity_id,
    entity_name,
    description,
    old_data,
    new_data,
    connection,
    school_id,
    user_id,
  }) {
    return this.log({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      module: auditModule,
      entity_type,
      entity_id,
      entity_name,
      description: description || `Updated ${entity_type} ${entity_name || entity_id || ""}`.trim(),
      old_data,
      new_data,
      connection,
      school_id,
      user_id,
    });
  },

  /**
   * Convenience method to log entity deletion
   */
  async logDelete({
    req,
    module: auditModule,
    entity_type,
    entity_id,
    entity_name,
    description,
    old_data,
    connection,
    school_id,
    user_id,
  }) {
    return this.log({
      req,
      action: AUDIT_ACTIONS.DELETE,
      module: auditModule,
      entity_type,
      entity_id,
      entity_name,
      description: description || `Deleted ${entity_type} ${entity_name || entity_id || ""}`.trim(),
      old_data,
      new_data: null,
      connection,
      school_id,
      user_id,
    });
  },

  /**
   * Convenience method for custom actions (ACTIVATE, DEACTIVATE, LOGIN, etc.)
   */
  async logAction({
    req,
    action,
    module: auditModule,
    entity_type,
    entity_id,
    entity_name,
    description,
    old_data,
    new_data,
    status,
    error_message,
    connection,
    school_id,
    user_id,
  }) {
    return this.log({
      req,
      action,
      module: auditModule,
      entity_type,
      entity_id,
      entity_name,
      description,
      old_data,
      new_data,
      status,
      error_message,
      connection,
      school_id,
      user_id,
    });
  },

  /**
   * Query audit logs with pagination and filters
   */
  async getLogs(filters = {}) {
    return auditRepository.findAuditLogs(filters);
  },

  /**
   * Get single audit log details by ID
   */
  async getLogById(id) {
    return auditRepository.findAuditLogById(id);
  },
};

export default auditService;
