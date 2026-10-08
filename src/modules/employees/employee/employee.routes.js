import express from "express";
import {
  createEmployee,
  getAllEmployee,
  getAllEmployeeByToken,
  getEmployeeFilterOptions,
  getEmployeeStats,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  assignUserToEmployee,
  unassignUserFromEmployee,
} from "./employee.controller.js";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { employeeUpload } from "../../../middlewares/employees.upload.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", employeeUpload, createEmployee);
router.post("/assign-user", assignUserToEmployee);
router.post("/unassign-user", unassignUserFromEmployee);

// Specialized GET routes must be declared before /:id
router.get("/token", verifyToken, getAllEmployeeByToken);
router.get("/filter-options", getEmployeeFilterOptions);
router.get("/stats", getEmployeeStats);

// Main list and detail routes
router.get("/", getAllEmployee);
router.get("/:id", getEmployeeById);

router.put("/:id", employeeUpload, updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
