import * as DepartmentService from "./department.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createDepartment = async (req, res) => {
  try {
    const result = await DepartmentService.createDepartment(req.body, req.user);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.DEPARTMENTS,
      entity_type: AUDIT_ENTITIES.DEPARTMENT,
      entity_id: result.id,
      entity_name: result.department?.name || req.body?.name,
      school_id: result.department?.school_id || req.body?.school_id,
      description: `Department '${result.department?.name || req.body?.name}' created successfully`,
      new_data: result.department,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.department,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.DEPARTMENTS,
        entity_type: AUDIT_ENTITIES.DEPARTMENT,
        entity_name: req.body?.name,
        school_id: req.body?.school_id,
        description: `Failed to create department: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create department",
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const result = await DepartmentService.updateDepartment(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.DEPARTMENTS,
      entity_type: AUDIT_ENTITIES.DEPARTMENT,
      entity_id: req.params.id,
      entity_name:
        result.updatedDepartment?.name || result.oldDepartment?.name,
      school_id: result.updatedDepartment?.school_id,
      description: `Department '${result.updatedDepartment?.name || result.oldDepartment?.name}' updated successfully`,
      old_data: result.oldDepartment,
      new_data: result.updatedDepartment,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedDepartment,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update department",
    });
  }
};

export const updateDepartmentStatus = async (req, res) => {
  try {
    const result = await DepartmentService.updateDepartmentStatus(
      req.params.id,
      req.body.status,
      req.user,
    );

    const action =
      req.body.status === "active"
        ? AUDIT_ACTIONS.ACTIVATE
        : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.DEPARTMENTS,
      entity_type: AUDIT_ENTITIES.DEPARTMENT,
      entity_id: req.params.id,
      entity_name:
        result.updatedDepartment?.name || result.oldDepartment?.name,
      school_id: result.updatedDepartment?.school_id,
      description: `Department '${result.updatedDepartment?.name}' status changed to ${req.body.status}`,
      old_data: result.oldDepartment,
      new_data: result.updatedDepartment,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedDepartment,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update department status",
    });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const result = await DepartmentService.getAllDepartments(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.departments || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch departments",
    });
  }
};

export const getAllDepartmentsByToken = async (req, res) => {
  try {
    const result = await DepartmentService.getAllDepartmentsByToken(
      req.user,
      req.query,
    );

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.departments || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch departments by token",
    });
  }
};

export const getDepartmentsBySchool = async (req, res) => {
  try {
    const result = await DepartmentService.getDepartmentsBySchool(
      req.params.school_id,
      req.query,
    );

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.departments || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch school departments",
    });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const data = await DepartmentService.getDepartmentById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch department",
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const result = await DepartmentService.deleteDepartment(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.DEPARTMENTS,
      entity_type: AUDIT_ENTITIES.DEPARTMENT,
      entity_id: req.params.id,
      entity_name: result.deletedDepartment?.name,
      school_id: result.deletedDepartment?.school_id,
      description: `Department '${result.deletedDepartment?.name}' deleted successfully`,
      old_data: result.deletedDepartment,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete department",
    });
  }
};

export const checkExistingDepartment = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await DepartmentService.checkExistingDepartment(data);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check department",
    });
  }
};
