import express from "express";
import {
  createEmployeeDesignation,
  getAllEmployeeDesignations,
  getAllEmployeeDesignationsByToken,
  getEmployeeDesignationById,
  updateEmployeeDesignation,
  updateEmployeeDesignationStatus,
  deleteEmployeeDesignation,
} from "./employee_designations.controller.js";
import { verifyToken } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all employee designation routes
router.use(verifyToken);

/* =================================================================
   CREATE
================================================================= */
router.post("/", createEmployeeDesignation);

/* =================================================================
   GET APIS (WITH ADVANCED FILTERS)
   Specialized /token route declared before /:id
================================================================= */
router.get("/token", getAllEmployeeDesignationsByToken);
router.get("/", getAllEmployeeDesignations);
router.get("/:id", getEmployeeDesignationById);

/* =================================================================
   UPDATE, STATUS TOGGLE & DELETE
================================================================= */
router.put("/:id", updateEmployeeDesignation);
router.patch("/status/:id", updateEmployeeDesignationStatus);
router.delete("/:id", deleteEmployeeDesignation);

export default router;