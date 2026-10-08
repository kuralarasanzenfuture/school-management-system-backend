import express from "express";
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getAllShiftsByToken,
} from "./employeeShift.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createShift);

router.get("/", getAllShifts);
router.get("/token", verifyToken, getAllShiftsByToken);

router.get("/:id", getShiftById);

router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

export default router;