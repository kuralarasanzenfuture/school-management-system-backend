import * as SubjectGroupService from "./subjectGroup.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =========================================
   🔴 CREATE
========================================= */
export const createSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.createSubjectGroup(
      req.body,
      req.user,
    );

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.SUBJECT_GROUPS,
      entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
      entity_id: result.id,
      entity_name: result.subjectGroup?.name || req.body?.name,
      school_id: result.subjectGroup?.school_id || req.body?.school_id,
      description: `Subject group '${result.subjectGroup?.name || req.body?.name}' created successfully`,
      new_data: result.subjectGroup,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.subjectGroup,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.SUBJECT_GROUPS,
        entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
        entity_name: req.body?.name,
        school_id: req.body?.school_id,
        description: `Failed to create subject group: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create subject group",
    });
  }
};

/* =========================================
   🔴 UPDATE
========================================= */
export const updateSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.updateSubjectGroup(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.SUBJECT_GROUPS,
      entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
      entity_id: req.params.id,
      entity_name: result.updatedSubjectGroup?.name,
      school_id: result.updatedSubjectGroup?.school_id,
      description: `Subject group '${result.updatedSubjectGroup?.name}' updated successfully`,
      old_data: result.oldSubjectGroup,
      new_data: result.updatedSubjectGroup,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.updatedSubjectGroup,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.SUBJECT_GROUPS,
        entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
        entity_id: req.params.id,
        description: `Failed to update subject group: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update subject group",
    });
  }
};

/* =========================================
   🔴 UPDATE STATUS
========================================= */
export const updateSubjectGroupStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await SubjectGroupService.updateSubjectGroupStatus(
      req.params.id,
      status,
      req.user,
    );

    await auditService.log({
      req,
      action: AUDIT_ACTIONS.STATUS_CHANGE,
      module: AUDIT_MODULES.SUBJECT_GROUPS,
      entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
      entity_id: req.params.id,
      entity_name: result.updatedSubjectGroup?.name,
      school_id: result.updatedSubjectGroup?.school_id,
      description: `Subject group '${result.updatedSubjectGroup?.name}' status changed to '${status}'`,
      old_data: result.oldSubjectGroup,
      new_data: result.updatedSubjectGroup,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.updatedSubjectGroup,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.STATUS_CHANGE,
        module: AUDIT_MODULES.SUBJECT_GROUPS,
        entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
        entity_id: req.params.id,
        description: `Failed to update subject group status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update subject group status",
    });
  }
};

/* =========================================
   🔴 GET ALL
========================================= */
export const getAllSubjectGroups = async (req, res) => {
  try {
    const result = await SubjectGroupService.getAllSubjectGroups(req.query);

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.subjectGroups,
      subjectGroups: result.subjectGroups,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subject groups",
    });
  }
};

/* =========================================
   🔴 GET BY TOKEN
========================================= */
export const getAllSubjectGroupsByToken = async (req, res) => {
  try {
    const result = await SubjectGroupService.getAllSubjectGroupsByToken(
      req.user,
      req.query,
    );

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.subjectGroups,
      subjectGroups: result.subjectGroups,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subject groups",
    });
  }
};

/* =========================================
   🔴 GET BY ID
========================================= */
export const getSubjectGroupById = async (req, res) => {
  try {
    const data = await SubjectGroupService.getSubjectGroupById(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subject group",
    });
  }
};

/* =========================================
   🔴 DELETE
========================================= */
export const deleteSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.deleteSubjectGroup(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.SUBJECT_GROUPS,
      entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
      entity_id: req.params.id,
      entity_name: result.deletedSubjectGroup?.name,
      school_id: result.deletedSubjectGroup?.school_id,
      description: `Subject group '${result.deletedSubjectGroup?.name}' deleted successfully`,
      old_data: result.deletedSubjectGroup,
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
        module: AUDIT_MODULES.SUBJECT_GROUPS,
        entity_type: AUDIT_ENTITIES.SUBJECT_GROUP,
        entity_id: req.params.id,
        description: `Failed to delete subject group: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete subject group",
    });
  }
};

/* =========================================
   🔴 CHECK EXISTING
========================================= */
export const checkExistingSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.checkExistingSubjectGroup(
      req.query,
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check subject group",
    });
  }
};

/* =========================================
   🔴 CHECK EXISTING BY TOKEN
========================================= */
export const checkExistingSubjectGroupByToken = async (req, res) => {
  try {
    const result = await SubjectGroupService.checkExistingSubjectGroupByToken(
      req.user,
      req.query,
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check subject group",
    });
  }
};
