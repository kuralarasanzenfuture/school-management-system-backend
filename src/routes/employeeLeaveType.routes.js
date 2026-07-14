import express from "express";
import {
  createLeaveType,
  getAllLeaveTypes,
  getAllLeaveTypesByToken,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
  checkExistingLeaveType,
} from "../modules/employees/employeeLeaveTypes/employeeLeaveType.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createLeaveType);

router.get("/", getAllLeaveTypes);
router.get("/token", verifyToken, getAllLeaveTypesByToken);
router.get("/check-leave-type", checkExistingLeaveType);
router.get("/:id", getLeaveTypeById);

router.put("/:id", updateLeaveType);
router.delete("/:id", deleteLeaveType);

export default router;
