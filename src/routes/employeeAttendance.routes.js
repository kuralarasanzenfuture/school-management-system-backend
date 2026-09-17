import express from "express";
import {
  markManualAttendance,
  getAllAttendance,
  getAllAttendanceByToken,
  getAttendanceById,
  getAttendanceByEmployee,
  getAttendanceByFilters,
  getAttendanceMatrix,
  getAttendanceByDateRange,
  updateAttendance,
  deleteAttendance,
  checkInAttendance,
  checkOutAttendance,
  getTodayAttendance,
} from "../modules/employeeAttendance/employeeAttendance.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Require authentication for all attendance endpoints
router.use(verifyToken);

// 📝 Manual Marking
router.post("/manual", markManualAttendance);

// ⏱️ Self-Service Check-In / Check-Out
router.post("/check-in", checkInAttendance);
router.post("/check-out", checkOutAttendance);
router.get("/today", getTodayAttendance);

// 📊 UI-Ready Matrix / Grid Views (Employee × Days)
router.get("/matrix", getAttendanceMatrix);
router.get("/grid", getAttendanceMatrix);

// 🔐 Token Scoped
router.get("/token", getAllAttendanceByToken);

// 🔍 Search & Filters (Supports both Matrix and Single Employee)
router.get("/filter", getAttendanceByFilters);
router.get("/filters", getAttendanceByFilters);
router.get("/employee/:employee_id", getAttendanceByEmployee);
router.get("/range", getAttendanceByDateRange);

// 📋 All Attendance
router.get("/", getAllAttendance);

// 🔎 Single ID Operations
router.get("/:id", getAttendanceById);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
