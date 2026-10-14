import express from "express";
import {
  createShift,
  getAllShifts,
  getAllShiftsByToken,
  getShiftById,
  updateShift,
  updateShiftStatus,
  deleteShift,
} from "./employeeShift.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

/* =================================================================
   CREATE
================================================================= */
router.post("/", createShift);

/* =================================================================
   GET APIS (WITH ADVANCED FILTERS)
   Specialized /token route declared before /:id
================================================================= */
router.get("/token", getAllShiftsByToken);
router.get("/", getAllShifts);
router.get("/:id", getShiftById);

/* =================================================================
   UPDATE, STATUS TOGGLE & DELETE
================================================================= */
router.put("/:id", updateShift);
router.patch("/status/:id", updateShiftStatus);
router.delete("/:id", deleteShift);

export default router;