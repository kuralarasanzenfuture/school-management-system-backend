import * as ClassService from "./class.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createClass = async (req, res) => {
  try {
    const result = await ClassService.createClass(req.body, req.user);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.CLASSES,
      entity_type: AUDIT_ENTITIES.CLASS,
      entity_id: result.id,
      entity_name: result.class?.name || req.body?.name,
      school_id: result.class?.school_id || req.body?.school_id,
      description: `Class '${result.class?.name || req.body?.name}' created successfully`,
      new_data: result.class,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.class,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.CLASSES,
        entity_type: AUDIT_ENTITIES.CLASS,
        entity_name: req.body?.name,
        school_id: req.body?.school_id,
        description: `Failed to create class: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create class",
    });
  }
};

export const updateClass = async (req, res) => {
  try {
    const result = await ClassService.updateClass(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.CLASSES,
      entity_type: AUDIT_ENTITIES.CLASS,
      entity_id: req.params.id,
      entity_name: result.updatedClass?.name || result.oldClass?.name,
      school_id: result.updatedClass?.school_id,
      description: `Class '${result.updatedClass?.name || result.oldClass?.name}' updated successfully`,
      old_data: result.oldClass,
      new_data: result.updatedClass,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedClass,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update class",
    });
  }
};

export const updateClassStatus = async (req, res) => {
  try {
    const result = await ClassService.updateClassStatus(
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
      module: AUDIT_MODULES.CLASSES,
      entity_type: AUDIT_ENTITIES.CLASS,
      entity_id: req.params.id,
      entity_name: result.updatedClass?.name || result.oldClass?.name,
      school_id: result.updatedClass?.school_id,
      description: `Class '${result.updatedClass?.name}' status changed to ${req.body.status}`,
      old_data: result.oldClass,
      new_data: result.updatedClass,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedClass,
      class: result.updatedClass,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update class status",
    });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const result = await ClassService.getAllClasses(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.classes || result,
      classes: result.classes || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch classes",
    });
  }
};

export const getAllClassesByToken = async (req, res) => {
  try {
    const result = await ClassService.getAllClassesByToken(
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
      data: result.classes || result,
      classes: result.classes || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch classes by token",
    });
  }
};

export const getAllClassesSchoolId = async (req, res) => {
  try {
    const school_id = req.params.school_id || req.query.school_id;
    const result = await ClassService.getAllClassesSchoolId(
      school_id,
      req.query,
    );

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.classes || result,
      classes: result.classes || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch school classes",
    });
  }
};

export const getClassById = async (req, res) => {
  try {
    const data = await ClassService.getClassById(req.params.id);
    res.json({
      success: true,
      data,
      class: data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class",
    });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const result = await ClassService.deleteClass(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.CLASSES,
      entity_type: AUDIT_ENTITIES.CLASS,
      entity_id: req.params.id,
      entity_name: result.deletedClass?.name,
      school_id: result.deletedClass?.school_id,
      description: `Class '${result.deletedClass?.name}' deleted successfully`,
      old_data: result.deletedClass,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete class",
    });
  }
};

export const checkExistingClass = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await ClassService.checkExistingClass(data);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check class",
    });
  }
};

export const checkExistingClassByToken = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await ClassService.checkExistingClassByToken(
      req.user,
      data,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check class by token",
    });
  }
};
