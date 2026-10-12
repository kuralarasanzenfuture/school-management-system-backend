import * as SectionService from "./section.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createSection = async (req, res) => {
  try {
    const result = await SectionService.createSection(req.body, req.user);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.SECTIONS,
      entity_type: AUDIT_ENTITIES.SECTION,
      entity_id: result.id,
      entity_name: result.section?.name || req.body?.name,
      school_id: result.section?.school_id,
      description: `Section '${result.section?.name || req.body?.name}' created successfully`,
      new_data: result.section,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.section,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.SECTIONS,
        entity_type: AUDIT_ENTITIES.SECTION,
        entity_name: req.body?.name,
        description: `Failed to create section: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create section",
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const result = await SectionService.updateSection(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.SECTIONS,
      entity_type: AUDIT_ENTITIES.SECTION,
      entity_id: req.params.id,
      entity_name: result.updatedSection?.name || result.oldSection?.name,
      school_id: result.updatedSection?.school_id,
      description: `Section '${result.updatedSection?.name || result.oldSection?.name}' updated successfully`,
      old_data: result.oldSection,
      new_data: result.updatedSection,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedSection,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update section",
    });
  }
};

export const updateSectionStatus = async (req, res) => {
  try {
    const result = await SectionService.updateSectionStatus(
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
      module: AUDIT_MODULES.SECTIONS,
      entity_type: AUDIT_ENTITIES.SECTION,
      entity_id: req.params.id,
      entity_name: result.updatedSection?.name || result.oldSection?.name,
      school_id: result.updatedSection?.school_id,
      description: `Section '${result.updatedSection?.name}' status changed to ${req.body.status}`,
      old_data: result.oldSection,
      new_data: result.updatedSection,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedSection,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update section status",
    });
  }
};

export const getAllSections = async (req, res) => {
  try {
    const result = await SectionService.getAllSections(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.sections || result,
      sections: result.sections || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch sections",
    });
  }
};

export const getAllSectionsByToken = async (req, res) => {
  try {
    const result = await SectionService.getAllSectionsByToken(
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
      data: result.sections || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch sections by token",
    });
  }
};

export const getAllSectionsClassId = async (req, res) => {
  try {
    const class_id =
      Number(req.params.class_id) || Number(req.query.class_id);

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing class_id",
      });
    }

    const result = await SectionService.getAllSectionsByClassId(
      class_id,
      req.query,
    );

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.sections || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch sections by class",
    });
  }
};

export const getSchoolTree = async (req, res) => {
  try {
    const school_id = req.query.school_id ? Number(req.query.school_id) : null;
    const data = await SectionService.getSchoolTree(school_id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch school tree",
    });
  }
};

export const getSectionById = async (req, res) => {
  try {
    const data = await SectionService.getSectionById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch section",
    });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const result = await SectionService.deleteSection(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.SECTIONS,
      entity_type: AUDIT_ENTITIES.SECTION,
      entity_id: req.params.id,
      entity_name: result.deletedSection?.name,
      school_id: result.deletedSection?.school_id,
      description: `Section '${result.deletedSection?.name}' deleted successfully`,
      old_data: result.deletedSection,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete section",
    });
  }
};

export const checkExistingSection = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await SectionService.checkExistingSection(data);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check section",
    });
  }
};

export const checkExistingSectionByToken = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await SectionService.checkExistingSectionByToken(
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
      message: err.message || "Failed to check section by token",
    });
  }
};
