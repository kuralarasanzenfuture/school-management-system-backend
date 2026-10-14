import * as Service from "./employee_designations.service.js";
import { auditService } from "../../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../../audit/audit.constants.js";

/* =================================================================
   CREATE EMPLOYEE DESIGNATION
================================================================= */
export const createEmployeeDesignation = async (req, res) => {
  try {
    const result = await Service.createDesignation(req.body, req.user);

    const designationName = result.designation?.name || req.body?.name || "";
    const schoolId = result.designation?.school_id || req.body?.school_id;

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
      entity_id: result.id,
      entity_name: designationName || `Designation #${result.id}`,
      school_id: schoolId,
      description: `Employee designation '${designationName}' created successfully`,
      new_data: result.designation || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
        entity_name: req.body?.name || null,
        school_id: req.body?.school_id,
        description: `Failed to create employee designation: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create employee designation",
    });
  }
};

/* =================================================================
   UPDATE EMPLOYEE DESIGNATION
================================================================= */
export const updateEmployeeDesignation = async (req, res) => {
  try {
    const result = await Service.updateDesignation(
      req.params.id,
      req.body,
      req.user,
    );

    const designationName =
      result.new_data?.name || result.old_data?.name || req.body?.name || "";
    const schoolId = result.new_data?.school_id || result.old_data?.school_id;

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
      entity_id: req.params.id,
      entity_name: designationName || `Designation #${req.params.id}`,
      school_id: schoolId,
      description: `Employee designation '${designationName}' updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
        entity_id: req.params.id,
        description: `Failed to update employee designation: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee designation",
    });
  }
};

/* =================================================================
   UPDATE EMPLOYEE DESIGNATION STATUS
================================================================= */
export const updateEmployeeDesignationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await Service.updateDesignationStatus(
      req.params.id,
      status,
      req.user,
    );

    const designationName =
      result.updatedDesignation?.name || result.oldDesignation?.name || "";
    const schoolId =
      result.updatedDesignation?.school_id || result.oldDesignation?.school_id;
    const action =
      status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
      entity_id: req.params.id,
      entity_name: designationName || `Designation #${req.params.id}`,
      school_id: schoolId,
      description: `Employee designation '${designationName}' status changed to '${status}'`,
      old_data: result.oldDesignation,
      new_data: result.updatedDesignation,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
        entity_id: req.params.id,
        description: `Failed to update employee designation status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee designation status",
    });
  }
};

/* =================================================================
   DELETE EMPLOYEE DESIGNATION
================================================================= */
export const deleteEmployeeDesignation = async (req, res) => {
  try {
    const result = await Service.deleteDesignation(req.params.id);

    const designationName = result.deletedDesignation?.name || "";
    const schoolId = result.deletedDesignation?.school_id;

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
      entity_id: req.params.id,
      entity_name: designationName || `Designation #${req.params.id}`,
      school_id: schoolId,
      description: `Employee designation '${designationName}' deleted successfully`,
      old_data: result.deletedDesignation,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEE_DESIGNATIONS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_DESIGNATION,
        entity_id: req.params.id,
        description: `Failed to delete employee designation: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete employee designation",
    });
  }
};

/* =================================================================
   RESPONSE ENVELOPE HELPER FOR LISTS
================================================================= */
const sendDesignationListResponse = (res, result, query = {}) => {
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
   GET ALL DESIGNATIONS (FILTERS & PAGINATION)
================================================================= */
export const getAllEmployeeDesignations = async (req, res) => {
  try {
    const result = await Service.getAllDesignations(req.query);
    return sendDesignationListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee designations",
    });
  }
};

/* =================================================================
   GET ALL DESIGNATIONS BY TOKEN (SCOPED TO USER'S SCHOOL)
================================================================= */
export const getAllEmployeeDesignationsByToken = async (req, res) => {
  try {
    const result = await Service.getAllDesignationsByToken(req.user, req.query);
    return sendDesignationListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee designations",
    });
  }
};

/* =================================================================
   GET DESIGNATION BY ID
================================================================= */
export const getEmployeeDesignationById = async (req, res) => {
  try {
    const result = await Service.getDesignationById(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
      designation: result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch designation",
    });
  }
};
