import express from "express";
import {
  createEmployeeSalaryComponent,
  getAllEmployeeSalaryComponents,
  getEmployeeSalaryComponentById,
  updateEmployeeSalaryComponent,
  updateEmployeeSalaryComponentStatus,
  deleteEmployeeSalaryComponent,
  getAllEmployeeSalaryComponentsByToken,
  checkExistingEmployeeSalaryComponent,
} from "./employeeSalaryComponent.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

/* =================================================================
   CREATE
================================================================= */
router.post("/", createEmployeeSalaryComponent);

/* =================================================================
   GET APIS (WITH ADVANCED FILTERS)
   Specialized sub-routes placed before /:id to prevent ID conflicts
================================================================= */
router.get("/check-existing", checkExistingEmployeeSalaryComponent);
router.get("/token", getAllEmployeeSalaryComponentsByToken);
router.get("/", getAllEmployeeSalaryComponents);
router.get("/:id", getEmployeeSalaryComponentById);

/* =================================================================
   UPDATE, STATUS TOGGLE & DELETE
================================================================= */
router.put("/:id", updateEmployeeSalaryComponent);
router.patch("/status/:id", updateEmployeeSalaryComponentStatus);
router.delete("/:id", deleteEmployeeSalaryComponent);

export default router;
