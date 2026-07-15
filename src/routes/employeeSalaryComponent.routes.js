import express from "express";
import {
  createEmployeeSalaryComponent,
  getAllEmployeeSalaryComponents,
  getEmployeeSalaryComponentById,
  updateEmployeeSalaryComponent,
  deleteEmployeeSalaryComponent,
  getAllEmployeeSalaryComponentsByToken,
  checkExistingEmployeeSalaryComponent,
} from "../modules/employee_salary_component/employeeSalaryComponent.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

// CREATE
router.post("/", createEmployeeSalaryComponent);

// DUPLICATE CHECK
router.get("/check-existing", checkExistingEmployeeSalaryComponent);

// TOKEN BASED
router.get("/token", verifyToken, getAllEmployeeSalaryComponentsByToken);

// READ
router.get("/", getAllEmployeeSalaryComponents);
router.get("/:id", getEmployeeSalaryComponentById);

// UPDATE
router.put("/:id", updateEmployeeSalaryComponent);

// DELETE
router.delete("/:id", deleteEmployeeSalaryComponent);

export default router;
