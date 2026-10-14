import * as Service from "./employeeShift.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =================================================================
   CREATE SHIFT
================================================================= */
export const createShift = async (req, res) => {
  try {
    const result = await Service.createShift(req.body, req.user);

    const shiftName = result.shift?.name || req.body?.name || "";
    const schoolId = result.shift?.school_id || req.body?.school_id;

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
      entity_id: result.id,
      entity_name: shiftName || `Shift #${result.id}`,
      school_id: schoolId,
      description: `Employee shift '${shiftName}' created successfully`,
      new_data: result.shift || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
        entity_name: req.body?.name || null,
        school_id: req.body?.school_id,
        description: `Failed to create employee shift: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create employee shift",
    });
  }
};

/* =================================================================
   UPDATE SHIFT
================================================================= */
export const updateShift = async (req, res) => {
  try {
    const result = await Service.updateShift(
      req.params.id,
      req.body,
      req.user,
    );

    const shiftName =
      result.new_data?.name || result.old_data?.name || req.body?.name || "";
    const schoolId = result.new_data?.school_id || result.old_data?.school_id;

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
      entity_id: req.params.id,
      entity_name: shiftName || `Shift #${req.params.id}`,
      school_id: schoolId,
      description: `Employee shift '${shiftName}' updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
        entity_id: req.params.id,
        description: `Failed to update employee shift: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee shift",
    });
  }
};

/* =================================================================
   UPDATE SHIFT STATUS
================================================================= */
export const updateShiftStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await Service.updateShiftStatus(
      req.params.id,
      status,
      req.user,
    );

    const shiftName =
      result.updatedShift?.name || result.oldShift?.name || "";
    const schoolId =
      result.updatedShift?.school_id || result.oldShift?.school_id;
    const action =
      status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
      entity_id: req.params.id,
      entity_name: shiftName || `Shift #${req.params.id}`,
      school_id: schoolId,
      description: `Employee shift '${shiftName}' status changed to '${status}'`,
      old_data: result.oldShift,
      new_data: result.updatedShift,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
        entity_id: req.params.id,
        description: `Failed to update employee shift status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee shift status",
    });
  }
};

/* =================================================================
   DELETE SHIFT
================================================================= */
export const deleteShift = async (req, res) => {
  try {
    const result = await Service.deleteShift(req.params.id);

    const shiftName = result.deletedShift?.name || "";
    const schoolId = result.deletedShift?.school_id;

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
      entity_id: req.params.id,
      entity_name: shiftName || `Shift #${req.params.id}`,
      school_id: schoolId,
      description: `Employee shift '${shiftName}' deleted successfully`,
      old_data: result.deletedShift,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEE_SHIFTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SHIFT,
        entity_id: req.params.id,
        description: `Failed to delete employee shift: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete employee shift",
    });
  }
};

/* =================================================================
   RESPONSE ENVELOPE HELPER FOR LISTS
================================================================= */
const sendShiftListResponse = (res, result, query = {}) => {
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
   GET ALL SHIFTS (FILTERS & PAGINATION)
================================================================= */
export const getAllShifts = async (req, res) => {
  try {
    const result = await Service.getAllShifts(req.query);
    return sendShiftListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee shifts",
    });
  }
};

/* =================================================================
   GET ALL SHIFTS BY TOKEN (SCOPED TO USER'S SCHOOL)
================================================================= */
export const getAllShiftsByToken = async (req, res) => {
  try {
    const result = await Service.getAllShiftsByToken(req.user, req.query);
    return sendShiftListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee shifts",
    });
  }
};

/* =================================================================
   GET SHIFT BY ID
================================================================= */
export const getShiftById = async (req, res) => {
  try {
    const data = await Service.getShiftById(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee shift",
    });
  }
};
