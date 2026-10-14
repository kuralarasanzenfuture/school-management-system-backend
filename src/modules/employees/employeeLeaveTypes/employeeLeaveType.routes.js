import express from "express";
import {
  createLeaveType,
  getAllLeaveTypes,
  getAllLeaveTypesByToken,
  getLeaveTypeById,
  updateLeaveType,
  updateLeaveTypeStatus,
  deleteLeaveType,
  checkExistingLeaveType,
} from "./employeeLeaveType.controller.js";
import { verifyToken } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

/* =================================================================
   CREATE
================================================================= */
router.post("/", createLeaveType);

/* =================================================================
   GET APIS (WITH ADVANCED FILTERS)
   Specialized routes declared before /:id to prevent ID collisions
================================================================= */
router.get("/token", getAllLeaveTypesByToken);
router.get("/check-leave-type", checkExistingLeaveType);
router.get("/", getAllLeaveTypes);
router.get("/:id", getLeaveTypeById);

/* =================================================================
   UPDATE, STATUS TOGGLE & DELETE
================================================================= */
router.put("/:id", updateLeaveType);
router.patch("/status/:id", updateLeaveTypeStatus);
router.delete("/:id", deleteLeaveType);

export default router;
