import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";

import {
  markAttendance,
  getAllAttendance,
  getAllAttendanceByToken,
  getAttendanceById,
  getAttendanceBySession,
  getAttendanceByDate,
  updateAttendance,
  deleteAttendance,
  lockAttendanceSession,
  unlockAttendanceSession,
  getAttendanceSummary,
  getAttendanceByStudentId,
  checkAttendanceTaken,
} from "./studentAttendance.controller.js";

const router = express.Router();

router.use(verifyToken);

/* ===========================================================
  STUDENT ATTENDANCE
=========================================================== */

// Check if attendance is already taken for a class section, date, type, and period
// Query: ?class_section_id=1&attendance_date=2026-10-21&attendance_type=daily&period_no=0
router.get("/check-attendance", checkAttendanceTaken);

// Create / Update Attendance Session + Student Attendance
// Handles: student_id and admission_id from admission table, period_no: 0 for daily & >0 for period
// If already taken without allow_update: returns 409 Conflict with informative validation message
router.post("/mark", markAttendance);

// Get All Attendance records (optional query filters: date, class_section_id, student_id, admission_id, class_id, school_id)
router.get("/", getAllAttendance);

// Get Attendance Scoped to User's School (from JWT Token or query school_id for admins)
router.get("/token", getAllAttendanceByToken);

// Attendance Count Summary (daily/period metrics)
router.get("/summary", getAttendanceSummary);

// Attendance by Date
// Example: /api/students-attendance/date?date=2026-07-22&class_section_id=1
router.get("/date", getAttendanceByDate);

// Attendance by Session ID
// Example: /api/students-attendance/session/15
router.get("/session/:session_id", getAttendanceBySession);

// Attendance History of Student (by student_id or admission_id)
// Example: /api/students-attendance/student/11832 or /api/students-attendance/student/5562
router.get("/student/:id", getAttendanceByStudentId);

// Single Attendance Record by ID
router.get("/:id", getAttendanceById);

// Update Attendance Record
router.put("/:id", updateAttendance);

// Delete Attendance Record
router.delete("/:id", deleteAttendance);

/* ===========================================================
   SESSION OPERATIONS
=========================================================== */

// Lock Session (prevents modification to attendance records)
router.patch("/session/:session_id/lock", lockAttendanceSession);

// Unlock Session (allows modification to attendance records)
router.patch("/session/:session_id/unlock", unlockAttendanceSession);

export default router;
