import * as Service from "./employeeLeaveType.service.js";
import { auditService } from "../../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../../audit/audit.constants.js";

/* =================================================================
   CREATE LEAVE TYPE
================================================================= */
export const createLeaveType = async (req, res) => {
  try {
    const result = await Service.createLeaveType(req.body, req.user);

    const leaveTypeName = result.leaveType?.name || req.body?.name || "";
    const schoolId = result.leaveType?.school_id || req.body?.school_id;

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
      entity_id: result.id,
      entity_name: leaveTypeName || `Leave Type #${result.id}`,
      school_id: schoolId,
      description: `Employee leave type '${leaveTypeName}' created successfully`,
      new_data: result.leaveType || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
        entity_name: req.body?.name || null,
        school_id: req.body?.school_id,
        description: `Failed to create employee leave type: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create employee leave type",
    });
  }
};

/* =================================================================
   UPDATE LEAVE TYPE
================================================================= */
export const updateLeaveType = async (req, res) => {
  try {
    const result = await Service.updateLeaveType(
      req.params.id,
      req.body,
      req.user,
    );

    const leaveTypeName =
      result.new_data?.name || result.old_data?.name || req.body?.name || "";
    const schoolId = result.new_data?.school_id || result.old_data?.school_id;

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
      entity_id: req.params.id,
      entity_name: leaveTypeName || `Leave Type #${req.params.id}`,
      school_id: schoolId,
      description: `Employee leave type '${leaveTypeName}' updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
        entity_id: req.params.id,
        description: `Failed to update employee leave type: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee leave type",
    });
  }
};

/* =================================================================
   UPDATE LEAVE TYPE STATUS
================================================================= */
export const updateLeaveTypeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await Service.updateLeaveTypeStatus(
      req.params.id,
      status,
      req.user,
    );

    const leaveTypeName =
      result.updatedLeaveType?.name || result.oldLeaveType?.name || "";
    const schoolId =
      result.updatedLeaveType?.school_id || result.oldLeaveType?.school_id;
    const action =
      status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
      entity_id: req.params.id,
      entity_name: leaveTypeName || `Leave Type #${req.params.id}`,
      school_id: schoolId,
      description: `Employee leave type '${leaveTypeName}' status changed to '${status}'`,
      old_data: result.oldLeaveType,
      new_data: result.updatedLeaveType,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
        entity_id: req.params.id,
        description: `Failed to update employee leave type status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee leave type status",
    });
  }
};

/* =================================================================
   DELETE LEAVE TYPE
================================================================= */
export const deleteLeaveType = async (req, res) => {
  try {
    const result = await Service.deleteLeaveType(req.params.id);

    const leaveTypeName = result.deletedLeaveType?.name || "";
    const schoolId = result.deletedLeaveType?.school_id;

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
      entity_id: req.params.id,
      entity_name: leaveTypeName || `Leave Type #${req.params.id}`,
      school_id: schoolId,
      description: `Employee leave type '${leaveTypeName}' deleted successfully`,
      old_data: result.deletedLeaveType,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEE_LEAVE_TYPES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_LEAVE_TYPE,
        entity_id: req.params.id,
        description: `Failed to delete employee leave type: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete employee leave type",
    });
  }
};

/* =================================================================
   RESPONSE ENVELOPE HELPER FOR LISTS
================================================================= */
const sendLeaveTypeListResponse = (res, result, query = {}) => {
  if (result.pagination) {
    res.set("X-Total-Count", String(result.pagination.total));
    res.set("X-Page", String(result.pagination.page));
    res.set("X-Limit", String(result.pagination.limit));
    res.set("X-Total-Pages", String(result.pagination.totalPages));
    res.set("X-From", String(result.pagination.from));
    res.set("X-To", String(result.pagination.to));
    res.set("X-Count", String(result.pagination.count));
  }

  const shouldPaginate =
    query.paginate === "true" ||
    query.format === "paginated" ||
    query.meta === "true";

  if (shouldPaginate) {
    return res.status(200).json({
      success: true,
      data: result.rows,
      total: result.pagination?.total,
      page: result.pagination?.page,
      limit: result.pagination?.limit,
      totalPages: result.pagination?.totalPages,
      pagination: result.pagination,
      filter_display: result.filter_display,
      filters: result.filters,
    });
  }

  // Default raw array response for backward compatibility
  return res.status(200).json(result.rows);
};

/* =================================================================
   GET ALL LEAVE TYPES (FILTERS & PAGINATION)
================================================================= */
export const getAllLeaveTypes = async (req, res) => {
  try {
    const result = await Service.getAllLeaveTypes(req.query);
    return sendLeaveTypeListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee leave types",
    });
  }
};

/* =================================================================
   GET ALL LEAVE TYPES BY TOKEN (SCOPED TO USER'S SCHOOL)
================================================================= */
export const getAllLeaveTypesByToken = async (req, res) => {
  try {
    const result = await Service.getAllLeaveTypesByToken(req.user, req.query);
    return sendLeaveTypeListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee leave types",
    });
  }
};

/* =================================================================
   GET LEAVE TYPE BY ID
================================================================= */
export const getLeaveTypeById = async (req, res) => {
  try {
    const data = await Service.getLeaveTypeById(req.params.id);
    res.status(200).json({
      success: true,
      data,
      leaveType: data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee leave type",
    });
  }
};

/* =================================================================
   CHECK EXISTING LEAVE TYPE (NAME/CODE CONFLICT CHECK)
================================================================= */
export const checkExistingLeaveType = async (req, res) => {
  try {
    const result = await Service.checkExistingLeaveType(req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check existing leave type",
    });
  }
};
