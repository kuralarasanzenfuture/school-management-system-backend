import express from "express";
import { createSalaryStructureWithDetails } from "../modules/employee_salary_structureAndDetail/employeeSalaryStructureWithDetail.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createSalaryStructureWithDetails);

export default router;
