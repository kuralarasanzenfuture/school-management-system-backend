import * as ClassSectionService from "./class_section.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createClassSection = async (req, res) => {
  try {
    const result = await ClassSectionService.createClassSection(
      req.body,
      req.user,
    );

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.CLASS_SECTIONS,
      entity_type: AUDIT_ENTITIES.CLASS_SECTION,
      entity_id: result.id,
      entity_name:
        result.classSection?.class_section || `Class Section #${result.id}`,
      school_id: result.classSection?.school_id || req.body?.school_id,
      description: `Class section mapping created successfully`,
      new_data: result.classSection,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.classSection,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.CLASS_SECTIONS,
        entity_type: AUDIT_ENTITIES.CLASS_SECTION,
        school_id: req.body?.school_id,
        description: `Failed to create class section mapping: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create class section",
    });
  }
};

export const getAllClassSections = async (req, res) => {
  try {
    const result = await ClassSectionService.getAllClassSections(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.classSections || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class sections",
    });
  }
};

export const getAllClassSectionsByToken = async (req, res) => {
  try {
    const result = await ClassSectionService.getAllClassSectionsByToken(
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
      data: result.classSections || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class sections by token",
    });
  }
};

export const updateClassSection = async (req, res) => {
  try {
    const result = await ClassSectionService.updateClassSection(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.CLASS_SECTIONS,
      entity_type: AUDIT_ENTITIES.CLASS_SECTION,
      entity_id: req.params.id,
      entity_name:
        result.updatedClassSection?.class_section ||
        result.oldClassSection?.class_section,
      school_id: result.updatedClassSection?.school_id,
      description: `Class section mapping updated successfully`,
      old_data: result.oldClassSection,
      new_data: result.updatedClassSection,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedClassSection,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update class section",
    });
  }
};

export const updateClassSectionStatus = async (req, res) => {
  try {
    const result = await ClassSectionService.updateClassSectionStatus(
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
      module: AUDIT_MODULES.CLASS_SECTIONS,
      entity_type: AUDIT_ENTITIES.CLASS_SECTION,
      entity_id: req.params.id,
      entity_name:
        result.updatedClassSection?.class_section ||
        result.oldClassSection?.class_section,
      school_id: result.updatedClassSection?.school_id,
      description: `Class section status changed to ${req.body.status}`,
      old_data: result.oldClassSection,
      new_data: result.updatedClassSection,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedClassSection,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update class section status",
    });
  }
};

export const getClassSectionById = async (req, res) => {
  try {
    const data = await ClassSectionService.getClassSectionById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class section",
    });
  }
};

export const deleteClassSection = async (req, res) => {
  try {
    const result = await ClassSectionService.deleteClassSection(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.CLASS_SECTIONS,
      entity_type: AUDIT_ENTITIES.CLASS_SECTION,
      entity_id: req.params.id,
      entity_name: result.deletedClassSection?.class_section,
      school_id: result.deletedClassSection?.school_id,
      description: `Class section mapping deleted successfully`,
      old_data: result.deletedClassSection,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete class section",
    });
  }
};

export const checkExistingClassSection = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result =
      await ClassSectionService.checkExistingClassSection(data);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check class section",
    });
  }
};

export const checkExistingClassSectionByToken = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result =
      await ClassSectionService.checkExistingClassSectionByToken(
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
      message: err.message || "Failed to check class section by token",
    });
  }
};
