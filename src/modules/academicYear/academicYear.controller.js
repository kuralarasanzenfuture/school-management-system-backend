import * as AcademicYearService from "./academicYear.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createAcademicYear = async (req, res) => {
  try {
    const result = await AcademicYearService.createAcademicYear(
      req.body,
      req.user,
    );

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.ACADEMIC_YEARS,
      entity_type: AUDIT_ENTITIES.ACADEMIC_YEAR,
      entity_id: result.id,
      entity_name: result.academicYear?.name || req.body?.name,
      school_id: result.academicYear?.school_id || req.body?.school_id,
      description: `Academic year '${result.academicYear?.name || req.body?.name}' created successfully`,
      new_data: result.academicYear,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.academicYear,
      id: result.id,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.ACADEMIC_YEARS,
        entity_type: AUDIT_ENTITIES.ACADEMIC_YEAR,
        entity_name: req.body?.name,
        school_id: req.body?.school_id,
        description: `Failed to create academic year: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create academic year",
    });
  }
};

export const updateAcademicYear = async (req, res) => {
  try {
    const result = await AcademicYearService.updateAcademicYear(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.ACADEMIC_YEARS,
      entity_type: AUDIT_ENTITIES.ACADEMIC_YEAR,
      entity_id: req.params.id,
      entity_name:
        result.updatedAcademicYear?.name || result.oldAcademicYear?.name,
      school_id: result.updatedAcademicYear?.school_id,
      description: `Academic year '${result.updatedAcademicYear?.name || result.oldAcademicYear?.name}' updated successfully`,
      old_data: result.oldAcademicYear,
      new_data: result.updatedAcademicYear,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedAcademicYear,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update academic year",
    });
  }
};

export const updateAcademicYearStatus = async (req, res) => {
  try {
    const result = await AcademicYearService.updateAcademicYearStatus(
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
      module: AUDIT_MODULES.ACADEMIC_YEARS,
      entity_type: AUDIT_ENTITIES.ACADEMIC_YEAR,
      entity_id: req.params.id,
      entity_name:
        result.updatedAcademicYear?.name || result.oldAcademicYear?.name,
      school_id: result.updatedAcademicYear?.school_id,
      description: `Academic year '${result.updatedAcademicYear?.name}' status changed to ${req.body.status}`,
      old_data: result.oldAcademicYear,
      new_data: result.updatedAcademicYear,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedAcademicYear,
      academicYear: result.updatedAcademicYear,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update academic year status",
    });
  }
};

export const getAllAcademicYears = async (req, res) => {
  try {
    const result = await AcademicYearService.getAllAcademicYears(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.academicYears || result,
      academicYears: result.academicYears || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch academic years",
    });
  }
};

export const getAllAcademicYearsByToken = async (req, res) => {
  try {
    const result = await AcademicYearService.getAllAcademicYearsByToken(
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
      data: result.academicYears || result,
      academicYears: result.academicYears || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch academic years by token",
    });
  }
};

export const getAcademicYearsBySchool = async (req, res) => {
  try {
    const school_id = req.params.school_id || req.query.school_id;
    const result = await AcademicYearService.getAcademicYearsBySchool(
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
      data: result.academicYears || result,
      academicYears: result.academicYears || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch school academic years",
    });
  }
};

export const getAcademicYearById = async (req, res) => {
  try {
    const data = await AcademicYearService.getAcademicYearById(req.params.id);

    res.json({
      success: true,
      data,
      academicYear: data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch academic year",
    });
  }
};

export const deleteAcademicYear = async (req, res) => {
  try {
    const result = await AcademicYearService.deleteAcademicYear(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.ACADEMIC_YEARS,
      entity_type: AUDIT_ENTITIES.ACADEMIC_YEAR,
      entity_id: req.params.id,
      entity_name: result.deletedAcademicYear?.name,
      school_id: result.deletedAcademicYear?.school_id,
      description: `Academic year '${result.deletedAcademicYear?.name}' deleted successfully`,
      old_data: result.deletedAcademicYear,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete academic year",
    });
  }
};

export const checkExistingAcademicYear = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await AcademicYearService.checkExistingAcademicYear(data);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check academic year",
    });
  }
};

export const checkExistingAcademicYearByToken = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result =
      await AcademicYearService.checkExistingAcademicYearByToken(
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
      message: err.message || "Failed to check academic year by token",
    });
  }
};
