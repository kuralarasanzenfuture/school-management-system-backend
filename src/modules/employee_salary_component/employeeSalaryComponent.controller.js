import * as Service from "./employeeSalaryComponent.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =================================================================
   CREATE SALARY COMPONENT
================================================================= */
export const createEmployeeSalaryComponent = async (req, res) => {
  try {
    const result = await Service.createComponent(req.body, req.user);

    const componentName = result.component?.name || req.body?.name || "";
    const schoolId = result.component?.school_id || req.body?.school_id;

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
      entity_id: result.id,
      entity_name: componentName || `Salary Component #${result.id}`,
      school_id: schoolId,
      description: `Employee salary component '${componentName}' created successfully`,
      new_data: result.component || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
        entity_name: req.body?.name || null,
        school_id: req.body?.school_id,
        description: `Failed to create employee salary component: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create employee salary component",
    });
  }
};

/* =================================================================
   UPDATE SALARY COMPONENT
================================================================= */
export const updateEmployeeSalaryComponent = async (req, res) => {
  try {
    const result = await Service.updateComponent(
      req.params.id,
      req.body,
      req.user,
    );

    const componentName =
      result.new_data?.name || result.old_data?.name || req.body?.name || "";
    const schoolId = result.new_data?.school_id || result.old_data?.school_id;

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
      entity_id: req.params.id,
      entity_name: componentName || `Salary Component #${req.params.id}`,
      school_id: schoolId,
      description: `Employee salary component '${componentName}' updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
        entity_id: req.params.id,
        description: `Failed to update employee salary component: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee salary component",
    });
  }
};

/* =================================================================
   UPDATE SALARY COMPONENT STATUS
================================================================= */
export const updateEmployeeSalaryComponentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await Service.updateComponentStatus(
      req.params.id,
      status,
      req.user,
    );

    const componentName =
      result.updatedComponent?.name || result.oldComponent?.name || "";
    const schoolId =
      result.updatedComponent?.school_id || result.oldComponent?.school_id;
    const action =
      status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
      entity_id: req.params.id,
      entity_name: componentName || `Salary Component #${req.params.id}`,
      school_id: schoolId,
      description: `Employee salary component '${componentName}' status changed to '${status}'`,
      old_data: result.oldComponent,
      new_data: result.updatedComponent,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
        entity_id: req.params.id,
        description: `Failed to update employee salary component status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update employee salary component status",
    });
  }
};

/* =================================================================
   DELETE SALARY COMPONENT
================================================================= */
export const deleteEmployeeSalaryComponent = async (req, res) => {
  try {
    const result = await Service.deleteComponent(req.params.id);

    const componentName = result.deletedComponent?.name || "";
    const schoolId = result.deletedComponent?.school_id;

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
      entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
      entity_id: req.params.id,
      entity_name: componentName || `Salary Component #${req.params.id}`,
      school_id: schoolId,
      description: `Employee salary component '${componentName}' deleted successfully`,
      old_data: result.deletedComponent,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEE_SALARY_COMPONENTS,
        entity_type: AUDIT_ENTITIES.EMPLOYEE_SALARY_COMPONENT,
        entity_id: req.params.id,
        description: `Failed to delete employee salary component: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete employee salary component",
    });
  }
};

/* =================================================================
   RESPONSE ENVELOPE HELPER FOR LISTS
================================================================= */
const sendSalaryComponentListResponse = (res, result, query = {}) => {
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
   GET ALL SALARY COMPONENTS (FILTERS & PAGINATION)
================================================================= */
export const getAllEmployeeSalaryComponents = async (req, res) => {
  try {
    const result = await Service.getAllComponents(req.query);
    return sendSalaryComponentListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee salary components",
    });
  }
};

/* =================================================================
   GET SALARY COMPONENTS BY TOKEN (SCOPED TO USER'S SCHOOL)
================================================================= */
export const getAllEmployeeSalaryComponentsByToken = async (req, res) => {
  try {
    const result = await Service.getComponentsByToken(req.user, req.query);
    return sendSalaryComponentListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee salary components",
    });
  }
};

/* =================================================================
   GET SALARY COMPONENT BY ID
================================================================= */
export const getEmployeeSalaryComponentById = async (req, res) => {
  try {
    const data = await Service.getComponentById(req.params.id);
    res.status(200).json({
      success: true,
      data,
      component: data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch employee salary component",
    });
  }
};

/* =================================================================
   CHECK EXISTING SALARY COMPONENT (NAME/CODE CONFLICT CHECK)
================================================================= */
export const checkExistingEmployeeSalaryComponent = async (req, res) => {
  try {
    const result = await Service.checkExistingComponent(req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check existing salary component",
    });
  }
};
