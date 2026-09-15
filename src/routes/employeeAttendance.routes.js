import express from "express";
import {
  markManualAttendance,
  getAllAttendance,
  getAllAttendanceByToken,
  getAttendanceById,
  getAttendanceByEmployee,
  getAttendanceByDateRange,
  updateAttendance,
  deleteAttendance,
  checkInAttendance,
  checkOutAttendance,
  getTodayAttendance,
} from "../modules/employeeAttendance/employeeAttendance.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/manual", markManualAttendance);

router.post("/check-in", verifyToken, checkInAttendance);
router.post("/check-out", verifyToken, checkOutAttendance);
router.get("/today", verifyToken, getTodayAttendance);

// 🔓 Public (or admin use)
router.get("/", getAllAttendance);

// 🔐 Role-based
router.get("/token", verifyToken, getAllAttendanceByToken);

// 🔍 Filters
router.get("/employee/:employee_id", getAttendanceByEmployee);
router.get("/range", getAttendanceByDateRange);

// 🔎 Single
router.get("/:id", getAttendanceById);

// ✏️ Update
router.put("/:id", updateAttendance);

// 🗑️ Delete
router.delete("/:id", deleteAttendance);

export default router;
