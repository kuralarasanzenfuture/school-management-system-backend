import * as Service from "./classSubject.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createClassSubject = async (req, res) => {
  try {
    const result = await Service.createClassSubject(req.body, req.user);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.CLASS_SUBJECTS,
      entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
      entity_id: result.id,
      entity_name: `${result.classSubject?.class_section_name || ''} - ${result.classSubject?.subject_name || ''}`.trim(),
      school_id: result.classSubject?.school_id || req.body?.school_id,
      description: `Subject '${result.classSubject?.subject_name}' assigned to class section '${result.classSubject?.class_section_name}'`,
      new_data: result.classSubject,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.classSubject,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.CLASS_SUBJECTS,
        entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
        description: `Failed to assign subject: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create class subject",
    });
  }
};

export const getAllClassSubjects = async (req, res) => {
  try {
    const result = await Service.getAllClassSubjects(req.query);

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.classSubjects,
      classSubjects: result.classSubjects,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class subjects",
    });
  }
};

export const getClassSubjectById = async (req, res) => {
  try {
    const data = await Service.getClassSubjectById(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class subject",
    });
  }
};

export const updateClassSubject = async (req, res) => {
  try {
    const result = await Service.updateClassSubject(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.CLASS_SUBJECTS,
      entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
      entity_id: req.params.id,
      entity_name: `${result.updatedClassSubject?.class_section_name || ''} - ${result.updatedClassSubject?.subject_name || ''}`.trim(),
      school_id: result.updatedClassSubject?.school_id,
      description: `Class subject mapping ID ${req.params.id} updated successfully`,
      old_data: result.oldClassSubject,
      new_data: result.updatedClassSubject,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.updatedClassSubject,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.CLASS_SUBJECTS,
        entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
        entity_id: req.params.id,
        description: `Failed to update class subject: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update class subject",
    });
  }
};

export const deleteClassSubject = async (req, res) => {
  try {
    const result = await Service.deleteClassSubject(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.CLASS_SUBJECTS,
      entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
      entity_id: req.params.id,
      entity_name: `${result.deletedClassSubject?.class_section_name || ''} - ${result.deletedClassSubject?.subject_name || ''}`.trim(),
      school_id: result.deletedClassSubject?.school_id,
      description: `Subject '${result.deletedClassSubject?.subject_name}' unassigned from class section '${result.deletedClassSubject?.class_section_name}'`,
      old_data: result.deletedClassSubject,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.CLASS_SUBJECTS,
        entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
        entity_id: req.params.id,
        description: `Failed to delete class subject: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete class subject",
    });
  }
};

export const getAllClassSubjectsByToken = async (req, res) => {
  try {
    const result = await Service.getAllClassSubjectsByToken(
      req.user,
      req.query,
    );

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.classSubjects,
      classSubjects: result.classSubjects,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch class subjects",
    });
  }
};

export const checkExistingClassSubject = async (req, res) => {
  try {
    const result = await Service.checkExistingClassSubject(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check class subject",
    });
  }
};

export const getAllClassSubjectsDetailed = async (req, res) => {
  try {
    const result = await Service.getAllClassSubjectsDetailed(
      req.user,
      req.query,
    );

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.classSubjects,
      classSubjects: result.classSubjects,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch detailed class subjects",
    });
  }
};

export const bulkAssignSubjects = async (req, res) => {
  try {
    const result = await Service.bulkAssignSubjects(req.body, req.user);

    await auditService.log({
      req,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.CLASS_SUBJECTS,
      entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
      description: `Bulk assigned ${result.count || 0} subjects to class section ID ${req.body?.class_section_id}`,
      new_data: req.body,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.CLASS_SUBJECTS,
        entity_type: AUDIT_ENTITIES.CLASS_SUBJECT,
        description: `Failed to bulk assign subjects: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to bulk assign subjects",
    });
  }
};
