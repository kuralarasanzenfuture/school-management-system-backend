import * as EmployeeService from "./employee.service.js";
import { auditService } from "../../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../../audit/audit.constants.js";

/* =================================================================
   CREATE EMPLOYEE
================================================================= */
export const createEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.createEmployee(req);

    const employeeName = `${result.employee?.first_name || req.body?.first_name || ""} ${result.employee?.last_name || req.body?.last_name || ""}`.trim();
    const employeeCode =
      result.employee?.employee_code || result.employee_code || "";

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.EMPLOYEES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE,
      entity_id: result.employee_id,
      entity_name:
        `${employeeName} (${employeeCode})`.trim() ||
        employeeName ||
        `Employee #${result.employee_id}`,
      school_id: result.employee?.school_id || req.body?.school_id,
      description: `Employee '${employeeName}' (${employeeCode}) created successfully`,
      new_data: result.employee || result.data,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      const employeeName = `${req.body?.first_name || ""} ${req.body?.last_name || ""}`.trim();
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.EMPLOYEES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE,
        entity_name: employeeName || null,
        school_id: req.body?.school_id,
        description: `Failed to create employee: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   UPDATE EMPLOYEE
================================================================= */
export const updateEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.updateEmployee(req.params.id, req);

    const employeeName = `${result.new_data?.first_name || result.old_data?.first_name || ""} ${result.new_data?.last_name || result.old_data?.last_name || ""}`.trim();
    const employeeCode =
      result.new_data?.employee_code || result.old_data?.employee_code || "";

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.EMPLOYEES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE,
      entity_id: req.params.id,
      entity_name:
        `${employeeName} (${employeeCode})`.trim() ||
        employeeName ||
        `Employee #${req.params.id}`,
      school_id: result.new_data?.school_id || result.old_data?.school_id,
      description: `Employee '${employeeName}' (${employeeCode}) updated successfully`,
      old_data: result.old_data,
      new_data: result.new_data,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE,
        entity_id: req.params.id,
        description: `Failed to update employee: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   UPDATE EMPLOYEE STATUS
================================================================= */
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await EmployeeService.updateEmployeeStatus(
      req.params.id,
      status,
      req,
    );

    const employeeName = `${result.updatedEmployee?.first_name || ""} ${result.updatedEmployee?.last_name || ""}`.trim();
    const employeeCode = result.updatedEmployee?.employee_code || "";
    const action =
      status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.EMPLOYEES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE,
      entity_id: req.params.id,
      entity_name:
        `${employeeName} (${employeeCode})`.trim() ||
        `Employee #${req.params.id}`,
      school_id: result.updatedEmployee?.school_id,
      description: `Employee '${employeeName}' (${employeeCode}) status changed to '${status}'`,
      old_data: result.oldEmployee,
      new_data: result.updatedEmployee,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE,
        entity_id: req.params.id,
        description: `Failed to update employee status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   DELETE EMPLOYEE
================================================================= */
export const deleteEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.deleteEmployee(req.params.id);

    const employeeName = `${result.deletedEmployee?.first_name || ""} ${result.deletedEmployee?.last_name || ""}`.trim();
    const employeeCode = result.deletedEmployee?.employee_code || "";

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.EMPLOYEES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE,
      entity_id: req.params.id,
      entity_name:
        `${employeeName} (${employeeCode})`.trim() ||
        `Employee #${req.params.id}`,
      school_id: result.deletedEmployee?.school_id,
      description: `Employee '${employeeName}' (${employeeCode}) deleted successfully`,
      old_data: result.deletedEmployee,
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.EMPLOYEES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE,
        entity_id: req.params.id,
        description: `Failed to delete employee: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   GET EMPLOYEE BY ID
================================================================= */
export const getEmployeeById = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployee(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   HELPER FOR LIST RESPONSES WITH FILTER METADATA
================================================================= */
const sendEmployeeListResponse = (res, result, query) => {
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

  // Default raw array response for backwards compatibility
  return res.status(200).json(result.rows);
};

/* =================================================================
   GET ALL EMPLOYEES (ADVANCED FILTERS)
================================================================= */
export const getAllEmployee = async (req, res) => {
  try {
    // If authenticated user is attached via verifyToken, scope via getEmployeesByToken
    // so non-admins are securely locked to their school even on direct /employees call
    const result = req.user
      ? await EmployeeService.getEmployeesByToken(req.user, req.query)
      : await EmployeeService.getEmployees(req.query);
    return sendEmployeeListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   GET ALL EMPLOYEES BY TOKEN (AUTO SCHOOL-SCOPED FILTERS)
================================================================= */
export const getAllEmployeeByToken = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployeesByToken(
      req.user,
      req.query,
    );
    return sendEmployeeListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   GET FILTER OPTIONS FOR DROPDOWNS
================================================================= */
export const getEmployeeFilterOptions = async (req, res) => {
  try {
    const options = await EmployeeService.getEmployeeFilterOptions(
      req.user,
      req.query.school_id,
    );
    res.json({ success: true, options });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   GET EMPLOYEE STATS / AGGREGATES
================================================================= */
export const getEmployeeStats = async (req, res) => {
  try {
    const stats = await EmployeeService.getEmployeeStats(
      req.user,
      req.query.school_id,
    );
    res.json({ success: true, stats });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   ASSIGN USER ACCOUNT TO EMPLOYEE
================================================================= */
export const assignUserToEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.assignUserToEmployee(req.body);

    const employeeName = `${result.employee?.first_name || ""} ${result.employee?.last_name || ""}`.trim();
    const employeeCode = result.employee?.employee_code || "";

    await auditService.logAction({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.EMPLOYEES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE,
      entity_id: req.body?.employee_id,
      entity_name:
        `${employeeName} (${employeeCode})`.trim() ||
        `Employee #${req.body?.employee_id}`,
      school_id: result.employee?.school_id,
      description: `User '${result.user?.username || result.user?.email || req.body?.user_id}' assigned to employee '${employeeName}' (${employeeCode})`,
      new_data: { user_id: req.body?.user_id },
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE,
        entity_id: req.body?.employee_id,
        description: `Failed to assign user to employee: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =================================================================
   UNASSIGN USER ACCOUNT FROM EMPLOYEE
================================================================= */
export const unassignUserFromEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.unassignUserFromEmployee(req.body);

    const employeeName = `${result.employee?.first_name || ""} ${result.employee?.last_name || ""}`.trim();
    const employeeCode = result.employee?.employee_code || "";

    await auditService.logAction({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.EMPLOYEES,
      entity_type: AUDIT_ENTITIES.EMPLOYEE,
      entity_id: req.body?.employee_id,
      entity_name:
        `${employeeName} (${employeeCode})`.trim() ||
        `Employee #${req.body?.employee_id}`,
      school_id: result.employee?.school_id,
      description: `User unassigned from employee '${employeeName}' (${employeeCode})`,
      old_data: { user_id: result.employee?.user_id },
      new_data: { user_id: null },
    });

    res.json(result);
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EMPLOYEES,
        entity_type: AUDIT_ENTITIES.EMPLOYEE,
        entity_id: req.body?.employee_id,
        description: `Failed to unassign user from employee: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({ message: err.message });
  }
};
