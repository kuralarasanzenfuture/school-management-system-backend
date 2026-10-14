import express from "express";
import {
  createEmployee,
  getAllEmployee,
  getAllEmployeeByToken,
  getEmployeeFilterOptions,
  getEmployeeStats,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  assignUserToEmployee,
  unassignUserFromEmployee,
} from "./employee.controller.js";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { employeeUpload } from "../../../middlewares/employees.upload.js";

const router = express.Router();

router.use(verifyToken);

/* =================================================================
   CREATE & USER LINKING
================================================================= */
router.post("/", employeeUpload, createEmployee);
router.post("/assign-user", assignUserToEmployee);
router.post("/unassign-user", unassignUserFromEmployee);

/* =================================================================
   FILTER OPTIONS, STATS & SCHOOL-SCOPED LIST
   (Declared before /:id wildcard route)
================================================================= */
router.get("/token", getAllEmployeeByToken);
router.get("/filter-options", getEmployeeFilterOptions);
router.get("/stats", getEmployeeStats);

/* =================================================================
   MAIN LIST (WITH ADVANCED FILTERS) & DETAIL
================================================================= */
router.get("/", getAllEmployee);
router.get("/:id", getEmployeeById);

/* =================================================================
   UPDATE, STATUS TOGGLE & DELETE
================================================================= */
router.put("/:id", employeeUpload, updateEmployee);
router.patch("/status/:id", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);

export default router;
