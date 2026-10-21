import * as Service from "./employeeSalaryStructureDetail.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =================================================================
   CREATE SALARY STRUCTURE DETAIL
================================================================= */
export const createSalaryStructureDetail = async (req, res) => {
  try {
    const result = await Service.createSalaryStructureDetail(
      req.body,
      req.user,
    );

    const componentName =
      result.detail?.component_name ||
      `Component #${result.detail?.component_id || req.body?.component_id}`;
    const structureName =
      result.detail?.structure_name ||
      `Structure #${result.detail?.salary_structure_id || req.body?.salary_structure_id}`;

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
      entity_id: result.id,
      entity_name: `${componentName} (${structureName})`,
      school_id: result.detail?.school_id,
      description: `Salary component '${componentName}' added to structure '${structureName}' successfully`,
      new_data: result.detail || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
        entity_name: `Structure #${req.body?.salary_structure_id}`,
        school_id: req.body?.school_id,
        description: `Failed to create salary structure detail: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create salary structure detail",
    });
  }
};

/* =================================================================
   BULK UPSERT SALARY STRUCTURE DETAILS
================================================================= */
export const bulkUpsertSalaryStructureDetails = async (req, res) => {
  try {
    const result = await Service.bulkUpsertSalaryStructureDetails(
      req.body,
      req.user,
    );

    await auditService.logAction({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
      entity_id: req.body?.salary_structure_id,
      entity_name: `Bulk Components (${result.structure_name || req.body?.salary_structure_id})`,
      school_id: result.school_id,
      description: `Bulk upserted ${result.count || 0} component(s) for salary structure #${req.body?.salary_structure_id}`,
      new_data: {
        salary_structure_id: req.body?.salary_structure_id,
        count: result.count,
        components: result.details || result.data,
      },
    });

    res.status(200).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
        entity_name: `Bulk Structure #${req.body?.salary_structure_id}`,
        description: `Failed to bulk upsert salary structure details: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to bulk upsert salary structure details",
    });
  }
};

/* =================================================================
   UPDATE SALARY STRUCTURE DETAIL
================================================================= */
export const updateSalaryStructureDetail = async (req, res) => {
  try {
    const result = await Service.updateSalaryStructureDetail(
      req.params.id,
      req.body,
      req.user,
    );

    const componentName =
      result.detail?.component_name ||
      result.old_data?.component_name ||
      `Detail #${req.params.id}`;
    const structureName =
      result.detail?.structure_name || result.old_data?.structure_name || "";

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
      entity_id: req.params.id,
      entity_name: `${componentName} (${structureName})`,
      school_id: result.detail?.school_id || result.old_data?.school_id,
      description: `Salary structure detail #${req.params.id} updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
        entity_id: req.params.id,
        description: `Failed to update salary structure detail: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update salary structure detail",
    });
  }
};

/* =================================================================
   DELETE SALARY STRUCTURE DETAIL
================================================================= */
export const deleteSalaryStructureDetail = async (req, res) => {
  try {
    const result = await Service.deleteSalaryStructureDetail(
      req.params.id,
      req.user,
    );

    const componentName =
      result.deletedDetail?.component_name || `Detail #${req.params.id}`;
    const structureName = result.deletedDetail?.structure_name || "";

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
      entity_id: req.params.id,
      entity_name: `${componentName} (${structureName})`,
      school_id: result.deletedDetail?.school_id,
      description: `Salary component '${componentName}' removed from structure '${structureName}' successfully`,
      old_data: result.deletedDetail,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_STRUCTURE_DETAILS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_STRUCTURE_DETAIL,
        entity_id: req.params.id,
        description: `Failed to delete salary structure detail: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete salary structure detail",
    });
  }
};

/* =================================================================
   RESPONSE ENVELOPE HELPER FOR LISTS
================================================================= */
const sendSalaryStructureDetailListResponse = (res, result, query = {}) => {
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
   GET ALL SALARY STRUCTURE DETAILS (FILTERS & PAGINATION)
================================================================= */
export const getAllSalaryStructureDetails = async (req, res) => {
  try {
    const result = await Service.getAllSalaryStructureDetails(req.query);
    return sendSalaryStructureDetailListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch salary structure details",
    });
  }
};

/* =================================================================
   GET SALARY STRUCTURE DETAILS BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getAllSalaryStructureDetailsByToken = async (req, res) => {
  try {
    const result = await Service.getAllSalaryStructureDetailsByToken(
      req.user,
      req.query,
    );
    return sendSalaryStructureDetailListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch salary structure details by token",
    });
  }
};

/* =================================================================
   GET SALARY STRUCTURE DETAIL BY ID
================================================================= */
export const getSalaryStructureDetailById = async (req, res) => {
  try {
    const data = await Service.getSalaryStructureDetailById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch salary structure detail",
    });
  }
};

/* =================================================================
   CALCULATE SALARY BY EMPLOYEE ID
================================================================= */
export const calculateSalaryByEmployeeId = async (req, res) => {
  try {
    const employee_id = req.params.employee_id || req.params.id;
    const result = await Service.calculateSalary(employee_id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to calculate salary",
    });
  }
};

/* =================================================================
   GET FULL SALARY BY EMPLOYEE ID
================================================================= */
export const getFullSalaryByEmployeeId = async (req, res) => {
  try {
    const employee_id = req.params.employee_id;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "employee_id required",
      });
    }

    const result = await Service.getFullSalaryByEmployee(employee_id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch full employee salary",
    });
  }
};
