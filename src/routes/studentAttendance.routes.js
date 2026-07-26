import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

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
} from "../modules/studentAttendance/studentAttendance.controller.js";

const router = express.Router();

router.use(verifyToken);

/* ===========================================================
   ATTENDANCE
=========================================================== */

// Create Attendance Session + Student Attendance
router.post("/mark", verifyToken, markAttendance);

// Get All Attendance
router.get("/", getAllAttendance);

// Get Attendance (School from Token)
router.get("/token", verifyToken, getAllAttendanceByToken);

// Attendance Summary
router.get("/summary", getAttendanceSummary);

// Attendance by Date
// Example:
// /api/student-attendance/date?attendance_date=2026-07-22
router.get("/date", getAttendanceByDate);

// Attendance by Session
// Example:
// /api/student-attendance/session/15
router.get("/session/:session_id", getAttendanceBySession);

// Attendance History of Student
// Example:
// /api/student-attendance/student/20
router.get("/student/:admission_id", getAttendanceByStudentId);



// Single Attendance Record
router.get("/:id", getAttendanceById);

// Update Attendance Record
router.put("/:id", updateAttendance);

// Delete Attendance Record
router.delete("/:id", deleteAttendance);

/* ===========================================================
   SESSION OPERATIONS
=========================================================== */

// Lock Session
router.patch("/session/:session_id/lock", verifyToken, lockAttendanceSession);

// Unlock Session
router.patch(
  "/session/:session_id/unlock",
  verifyToken,
  unlockAttendanceSession,
);

export default router;
