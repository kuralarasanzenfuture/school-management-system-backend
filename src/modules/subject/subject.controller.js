import * as SubjectService from "./subject.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createSubject = async (req, res) => {
  try {
    const result = await SubjectService.createSubject(req.body, req.user);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.SUBJECTS,
      entity_type: AUDIT_ENTITIES.SUBJECT,
      entity_id: result.id,
      entity_name: result.subject?.name || req.body?.name,
      school_id: result.subject?.school_id || req.body?.school_id,
      description: `Subject '${result.subject?.name || req.body?.name}' created successfully`,
      new_data: result.subject,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.subject,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.SUBJECTS,
        entity_type: AUDIT_ENTITIES.SUBJECT,
        entity_name: req.body?.name,
        school_id: req.body?.school_id,
        description: `Failed to create subject: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create subject",
    });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const result = await SubjectService.updateSubject(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.SUBJECTS,
      entity_type: AUDIT_ENTITIES.SUBJECT,
      entity_id: req.params.id,
      entity_name:
        result.updatedSubject?.name || result.oldSubject?.name,
      school_id: result.updatedSubject?.school_id,
      description: `Subject '${result.updatedSubject?.name || result.oldSubject?.name}' updated successfully`,
      old_data: result.oldSubject,
      new_data: result.updatedSubject,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedSubject,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update subject",
    });
  }
};

export const updateSubjectStatus = async (req, res) => {
  try {
    const result = await SubjectService.updateSubjectStatus(
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
      module: AUDIT_MODULES.SUBJECTS,
      entity_type: AUDIT_ENTITIES.SUBJECT,
      entity_id: req.params.id,
      entity_name:
        result.updatedSubject?.name || result.oldSubject?.name,
      school_id: result.updatedSubject?.school_id,
      description: `Subject '${result.updatedSubject?.name}' status changed to ${req.body.status}`,
      old_data: result.oldSubject,
      new_data: result.updatedSubject,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedSubject,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update subject status",
    });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const result = await SubjectService.getAllSubjects(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.subjects || result,
      subjects: result.subjects || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subjects",
    });
  }
};

export const getAllSubjectsByToken = async (req, res) => {
  try {
    const result = await SubjectService.getAllSubjectsByToken(
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
      data: result.subjects || result,
      subjects: result.subjects || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subjects by token",
    });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const data = await SubjectService.getSubjectById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subject",
    });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const result = await SubjectService.deleteSubject(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.SUBJECTS,
      entity_type: AUDIT_ENTITIES.SUBJECT,
      entity_id: req.params.id,
      entity_name: result.deletedSubject?.name,
      school_id: result.deletedSubject?.school_id,
      description: `Subject '${result.deletedSubject?.name}' deleted successfully`,
      old_data: result.deletedSubject,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete subject",
    });
  }
};

export const checkExistingSubject = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await SubjectService.checkExistingSubject(data);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check subject",
    });
  }
};

export const checkExistingSubjectByToken = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await SubjectService.checkExistingSubjectByToken(
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
      message: err.message || "Failed to check subject by token",
    });
  }
};
