import * as Service from "./studentAttendance.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* ===========================
   MARK ATTENDANCE
=========================== */
export const markAttendance = async (req, res) => {
  try {
    const result = await Service.markAttendance(req.user, req.body);

    await auditService.log({
      req,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.STUDENT_ATTENDANCE,
      entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE_SESSION,
      entity_id: result.attendance_session_id,
      entity_name: `Session #${result.attendance_session_id} (${result.attendance_type})`,
      school_id: result.school_id || req.user?.school_id,
      description: `Attendance marked for class section #${req.body.class_section_id} on ${req.body.attendance_date} (${result.attendance_type}, period ${result.period_no}) - ${result.total_students} students`,
      new_data: {
        session_id: result.attendance_session_id,
        class_section_id: req.body.class_section_id,
        attendance_date: req.body.attendance_date,
        attendance_type: result.attendance_type,
        period_no: result.period_no,
        total_students: result.total_students,
      },
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Mark Attendance Error:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.STUDENT_ATTENDANCE,
        entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE_SESSION,
        school_id: req.user?.school_id,
        description: `Failed to mark attendance: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   GET ALL ATTENDANCE
=========================== */
export const getAllAttendance = async (req, res) => {
  try {
    const result = await Service.getAllAttendance(req.query);
    res.json(result);
  } catch (err) {
    console.error("Get All Attendance Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   GET ALL BY TOKEN
=========================== */
export const getAllAttendanceByToken = async (req, res) => {
  try {
    const result = await Service.getAllAttendanceByToken(req.user, req.query);
    res.json(result);
  } catch (err) {
    console.error("Get Attendance By Token Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   GET BY SESSION ID
=========================== */
export const getAttendanceBySession = async (req, res) => {
  try {
    const result = await Service.getAttendanceBySession(
      req.params.session_id,
      req.user,
    );
    res.json(result);
  } catch (err) {
    console.error("Get Attendance By Session Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   GET BY ID
=========================== */
export const getAttendanceById = async (req, res) => {
  try {
    const result = await Service.getAttendanceById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("Get Attendance By Id Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   GET BY STUDENT
=========================== */
export const getAttendanceByStudentId = async (req, res) => {
  try {
    const studentIdentifier =
      req.params.id || req.params.admission_id || req.params.student_id;
    const result = await Service.getAttendanceByStudent(
      studentIdentifier,
      req.query,
    );
    res.json(result);
  } catch (err) {
    console.error("Get Attendance By Student Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   GET BY DATE
=========================== */
export const getAttendanceByDate = async (req, res) => {
  try {
    const result = await Service.getAttendanceByDate(req.query);
    res.json(result);
  } catch (err) {
    console.error("Get Attendance By Date Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   UPDATE ATTENDANCE
=========================== */
export const updateAttendance = async (req, res) => {
  try {
    const result = await Service.updateAttendance(
      req.params.id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.STUDENT_ATTENDANCE,
      entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE,
      entity_id: req.params.id,
      entity_name: `Student Attendance #${req.params.id}`,
      school_id: result.school_id || req.user?.school_id,
      description: `Attendance record #${req.params.id} updated`,
      old_data: result.oldAttendance,
      new_data: result.updatedAttendance,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedAttendance,
    });
  } catch (err) {
    console.error("Update Attendance Error:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.STUDENT_ATTENDANCE,
        entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE,
        entity_id: req.params.id,
        school_id: req.user?.school_id,
        description: `Failed to update attendance record #${req.params.id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   DELETE ATTENDANCE
=========================== */
export const deleteAttendance = async (req, res) => {
  try {
    const result = await Service.deleteAttendance(req.params.id, req.user);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.STUDENT_ATTENDANCE,
      entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE,
      entity_id: req.params.id,
      entity_name: `Student Attendance #${req.params.id}`,
      school_id: result.school_id || req.user?.school_id,
      description: `Attendance record #${req.params.id} deleted`,
      old_data: result.deletedAttendance,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("Delete Attendance Error:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.STUDENT_ATTENDANCE,
        entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE,
        entity_id: req.params.id,
        school_id: req.user?.school_id,
        description: `Failed to delete attendance record #${req.params.id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   LOCK SESSION
=========================== */
export const lockAttendanceSession = async (req, res) => {
  try {
    const result = await Service.lockAttendanceSession(
      req.params.session_id,
      req.user,
    );

    await auditService.log({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.STUDENT_ATTENDANCE,
      entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE_SESSION,
      entity_id: req.params.session_id,
      entity_name: `Session #${req.params.session_id}`,
      school_id: result.school_id || req.user?.school_id,
      description: `Attendance session #${req.params.session_id} locked`,
      new_data: { session_id: req.params.session_id, is_locked: true },
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("Lock Session Error:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.STUDENT_ATTENDANCE,
        entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE_SESSION,
        entity_id: req.params.session_id,
        school_id: req.user?.school_id,
        description: `Failed to lock attendance session #${req.params.session_id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   UNLOCK SESSION
=========================== */
export const unlockAttendanceSession = async (req, res) => {
  try {
    const result = await Service.unlockAttendanceSession(
      req.params.session_id,
      req.user,
    );

    await auditService.log({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.STUDENT_ATTENDANCE,
      entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE_SESSION,
      entity_id: req.params.session_id,
      entity_name: `Session #${req.params.session_id}`,
      school_id: result.school_id || req.user?.school_id,
      description: `Attendance session #${req.params.session_id} unlocked`,
      new_data: { session_id: req.params.session_id, is_locked: false },
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("Unlock Session Error:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.STUDENT_ATTENDANCE,
        entity_type: AUDIT_ENTITIES.STUDENT_ATTENDANCE_SESSION,
        entity_id: req.params.session_id,
        school_id: req.user?.school_id,
        description: `Failed to unlock attendance session #${req.params.session_id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   ATTENDANCE SUMMARY
=========================== */
export const getAttendanceSummary = async (req, res) => {
  try {
    const result = await Service.getAttendanceSummary(req.query);
    res.json(result);
  } catch (err) {
    console.error("Get Attendance Summary Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================
   CHECK ATTENDANCE TAKEN
=========================== */
export const checkAttendanceTaken = async (req, res) => {
  try {
    const result = await Service.checkAttendanceTaken(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Check Attendance Taken Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

