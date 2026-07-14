import express from "express";
import {
  markManualAttendance,
  getAllAttendance,
  getAllAttendanceByToken,
  getAttendanceById,
  getAttendanceByEmployee,
  getAttendanceByDateRange,
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

export default router;
