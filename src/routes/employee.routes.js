import express from "express";
import {
  createEmployee,
  getAllEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  assignUserToEmployee,
  unassignUserFromEmployee,
} from "../modules/employees/employee/employee.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { employeeUpload } from "../middlewares/employees.upload.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", employeeUpload, createEmployee);
router.post("/assign-user", assignUserToEmployee);
router.post("/unassign-user", unassignUserFromEmployee);
router.get("/", getAllEmployee);
router.get("/:id", getEmployeeById);
router.put("/:id", employeeUpload, updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
