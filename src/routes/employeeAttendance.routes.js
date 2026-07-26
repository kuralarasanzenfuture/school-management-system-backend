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
} from "../modules/employeeAttendance/employeeAttendance.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/manual", markManualAttendance);

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
