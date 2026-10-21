import * as Service from "./employeeSalaryStructure.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =================================================================
   CREATE SALARY STRUCTURE
================================================================= */
export const createSalaryStructure = async (req, res) => {
  try {
    const result = await Service.createSalaryStructure(req.body, req.user);

    const structureName =
      result.salaryStructure?.structure_name ||
      result.data?.structure_name ||
      `Salary Structure #${result.id}`;
    const schoolId =
      result.salaryStructure?.school_id ||
      result.data?.school_id ||
      req.body?.school_id;

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
      entity_id: result.id,
      entity_name: structureName,
      school_id: schoolId,
      description: `Employee salary structure '${structureName}' created successfully`,
      new_data: result.salaryStructure || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
        entity_name: req.body?.structure_name || null,
        school_id: req.body?.school_id,
        description: `Failed to create employee salary structure: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create employee salary structure",
    });
  }
};

/* =================================================================
   UPDATE SALARY STRUCTURE
================================================================= */
export const updateSalaryStructure = async (req, res) => {
  try {
    const result = await Service.updateSalaryStructure(
      req.params.id,
      req.body,
      req.user,
    );

    const structureName =
      result.new_data?.structure_name ||
      result.old_data?.structure_name ||
      `Salary Structure #${req.params.id}`;
    const schoolId = result.new_data?.school_id || result.old_data?.school_id;

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
      entity_id: req.params.id,
      entity_name: structureName,
      school_id: schoolId,
      description: `Employee salary structure '${structureName}' updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
        entity_id: req.params.id,
        description: `Failed to update employee salary structure: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee salary structure",
    });
  }
};

/* =================================================================
   UPDATE SALARY STRUCTURE STATUS
================================================================= */
export const updateSalaryStructureStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await Service.updateSalaryStructureStatus(
      req.params.id,
      status,
      req.user,
    );

    const structureName =
      result.updatedSalaryStructure?.structure_name ||
      result.oldSalaryStructure?.structure_name ||
      `Salary Structure #${req.params.id}`;
    const schoolId =
      result.updatedSalaryStructure?.school_id ||
      result.oldSalaryStructure?.school_id;
    const action =
      status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
      entity_id: req.params.id,
      entity_name: structureName,
      school_id: schoolId,
      description: `Employee salary structure '${structureName}' status changed to '${status}'`,
      old_data: result.oldSalaryStructure,
      new_data: result.updatedSalaryStructure,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
        entity_id: req.params.id,
        description: `Failed to update employee salary structure status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee salary structure status",
    });
  }
};

/* =================================================================
   DELETE SALARY STRUCTURE
================================================================= */
export const deleteSalaryStructure = async (req, res) => {
  try {
    const result = await Service.deleteSalaryStructure(
      req.params.id,
      req.user,
    );

    const structureName =
      result.deletedSalaryStructure?.structure_name ||
      `Salary Structure #${req.params.id}`;
    const schoolId = result.deletedSalaryStructure?.school_id;

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
      entity_id: req.params.id,
      entity_name: structureName,
      school_id: schoolId,
      description: `Employee salary structure '${structureName}' deleted successfully`,
      old_data: result.deletedSalaryStructure,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE,
        entity_id: req.params.id,
        description: `Failed to delete employee salary structure: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete employee salary structure",
    });
  }
};

/* =================================================================
   RESPONSE ENVELOPE HELPER FOR LISTS
================================================================= */
const sendSalaryStructureListResponse = (res, result, query = {}) => {
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
   GET ALL SALARY STRUCTURES (FILTERS & PAGINATION)
================================================================= */
export const getAllSalaryStructures = async (req, res) => {
  try {
    const result = await Service.getAllSalaryStructures(req.query);
    return sendSalaryStructureListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee salary structures",
    });
  }
};

/* =================================================================
   GET SALARY STRUCTURES BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getAllSalaryStructuresByToken = async (req, res) => {
  try {
    const result = await Service.getAllSalaryStructuresByToken(
      req.user,
      req.query,
    );
    return sendSalaryStructureListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message:
        err.message || "Failed to fetch employee salary structures by token",
    });
  }
};

/* =================================================================
   GET SALARY STRUCTURE BY ID
================================================================= */
export const getSalaryStructureById = async (req, res) => {
  try {
    const data = await Service.getSalaryStructureById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch salary structure",
    });
  }
};
