import * as StudentService from "./student.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =========================================
   🔴 CREATE STUDENT
========================================= */
export const createStudent = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw { status: 400, message: "Request body is empty" };
    }

    const result = await StudentService.createStudent(req);

    const studentName = `${result.student?.first_name || req.body?.first_name || ""} ${result.student?.last_name || req.body?.last_name || ""}`.trim();
    const studentCode = result.student?.student_code || result.student_code || "";

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.STUDENTS,
      entity_type: AUDIT_ENTITIES.STUDENT,
      entity_id: result.id,
      entity_name: `${studentName} (${studentCode})`.trim(),
      school_id: result.student?.school_id || req.body?.school_id,
      description: `Student '${studentName}' (${studentCode}) created successfully`,
      new_data: result.student,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      id: result.id,
      student_code: result.student_code,
      data: result.student,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      const studentName = `${req.body?.first_name || ""} ${req.body?.last_name || ""}`.trim();
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.STUDENTS,
        entity_type: AUDIT_ENTITIES.STUDENT,
        entity_name: studentName || null,
        school_id: req.body?.school_id,
        description: `Failed to create student: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create student",
    });
  }
};

/* =========================================
   🔴 GET ALL STUDENTS
========================================= */
export const getAllStudents = async (req, res) => {
  try {
    const result = await StudentService.getAllStudents(req.query);

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.students,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch students",
    });
  }
};

/* =========================================
   🔴 GET ALL STUDENTS BY TOKEN
========================================= */
export const getAllStudentsByToken = async (req, res) => {
  try {
    const result = await StudentService.getAllStudentsByToken(
      req.user,
      req.query,
    );

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);

    res.status(200).json({
      success: true,
      data: result.students,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch students",
    });
  }
};

/* =========================================
   🔴 GET STUDENT BY ID
========================================= */
export const getStudentById = async (req, res) => {
  try {
    const data = await StudentService.getStudentById(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch student",
    });
  }
};

/* =========================================
   🔴 UPDATE STUDENT
========================================= */
export const updateStudent = async (req, res) => {
  try {
    const result = await StudentService.updateStudent(req.params.id, req);

    const studentName = `${result.updatedStudent?.first_name || ""} ${result.updatedStudent?.last_name || ""}`.trim();
    const studentCode = result.updatedStudent?.student_code || "";

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.STUDENTS,
      entity_type: AUDIT_ENTITIES.STUDENT,
      entity_id: req.params.id,
      entity_name: `${studentName} (${studentCode})`.trim(),
      school_id: result.updatedStudent?.school_id,
      description: `Student '${studentName}' (${studentCode}) updated successfully`,
      old_data: result.oldStudent,
      new_data: result.updatedStudent,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.updatedStudent,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.STUDENTS,
        entity_type: AUDIT_ENTITIES.STUDENT,
        entity_id: req.params.id,
        description: `Failed to update student: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update student",
    });
  }
};

/* =========================================
   🔴 UPDATE STUDENT STATUS
========================================= */
export const updateStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await StudentService.updateStudentStatus(req.params.id, status, req);

    const studentName = `${result.updatedStudent?.first_name || ""} ${result.updatedStudent?.last_name || ""}`.trim();
    const studentCode = result.updatedStudent?.student_code || "";

    await auditService.log({
      req,
      action: AUDIT_ACTIONS.STATUS_CHANGE,
      module: AUDIT_MODULES.STUDENTS,
      entity_type: AUDIT_ENTITIES.STUDENT,
      entity_id: req.params.id,
      entity_name: `${studentName} (${studentCode})`.trim(),
      school_id: result.updatedStudent?.school_id,
      description: `Student '${studentName}' (${studentCode}) status changed to '${status}'`,
      old_data: result.oldStudent,
      new_data: result.updatedStudent,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.updatedStudent,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.STATUS_CHANGE,
        module: AUDIT_MODULES.STUDENTS,
        entity_type: AUDIT_ENTITIES.STUDENT,
        entity_id: req.params.id,
        description: `Failed to update student status: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update student status",
    });
  }
};

/* =========================================
   🔴 DELETE STUDENT
========================================= */
export const deleteStudent = async (req, res) => {
  try {
    const result = await StudentService.deleteStudent(req.params.id);

    const studentName = `${result.deletedStudent?.first_name || ""} ${result.deletedStudent?.last_name || ""}`.trim();
    const studentCode = result.deletedStudent?.student_code || "";

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.STUDENTS,
      entity_type: AUDIT_ENTITIES.STUDENT,
      entity_id: req.params.id,
      entity_name: `${studentName} (${studentCode})`.trim(),
      school_id: result.deletedStudent?.school_id,
      description: `Student '${studentName}' (${studentCode}) deleted successfully`,
      old_data: result.deletedStudent,
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
        module: AUDIT_MODULES.STUDENTS,
        entity_type: AUDIT_ENTITIES.STUDENT,
        entity_id: req.params.id,
        description: `Failed to delete student: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete student",
    });
  }
};


/* =========================================
   GET NON-ADMISSION (UNADMITTED) STUDENTS
========================================= */
export const getNonAdmissionStudents = async (req, res) => {
  try {
    const result = await StudentService.getNonAdmissionStudents(req.query);
    res.setHeader("X-Total-Count", result.total);
    res.status(200).json({
      success: true,
      data: result.students,
      total: result.total,
      academic_year_id: result.academic_year_id,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch non-admission students",
    });
  }
};

export const getNonAdmissionStudentsByToken = async (req, res) => {
  try {
    const result = await StudentService.getNonAdmissionStudentsByToken(
      req.user,
      req.query,
    );
    res.setHeader("X-Total-Count", result.total);
    res.status(200).json({
      success: true,
      data: result.students,
      total: result.total,
      academic_year_id: result.academic_year_id,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch non-admission students",
    });
  }
};
