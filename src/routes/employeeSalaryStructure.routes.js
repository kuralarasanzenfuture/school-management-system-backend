import express from "express";
import {
  createSalaryStructure,
  getAllSalaryStructures,
  getSalaryStructureById,
  updateSalaryStructure,
  deleteSalaryStructure,
  getAllSalaryStructuresByToken,
} from "../modules/employee_salary_structure/employeeSalaryStructure.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createSalaryStructure);
router.get("/", getAllSalaryStructures);
router.get("/token", verifyToken, getAllSalaryStructuresByToken);
router.get("/:id", getSalaryStructureById);
router.put("/:id", updateSalaryStructure);
router.delete("/:id", deleteSalaryStructure);

export default router;
