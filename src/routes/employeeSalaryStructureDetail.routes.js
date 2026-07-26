import express from "express";
import {
  createSalaryStructureDetail,
  getAllSalaryStructureDetails,
  getSalaryStructureDetailById,
  updateSalaryStructureDetail,
  deleteSalaryStructureDetail,
  bulkUpsertSalaryStructureDetails,
  getAllSalaryStructureDetailsByToken,
  calculateSalaryByEmployeeId,
  getFullSalaryByEmployeeId,
} from "../modules/employee_salary_structure_details/employeeSalaryStructureDetail.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createSalaryStructureDetail);

// 🔥 bulk (real-world usage)
router.post("/bulk", bulkUpsertSalaryStructureDetails);

router.get("/token", verifyToken, getAllSalaryStructureDetailsByToken);

router.get(
  "/salary-calculatebyemployee/:employee_id",
  calculateSalaryByEmployeeId,
);

router.get("/full-salary-by-employee/:employee_id", getFullSalaryByEmployeeId);

router.get("/", getAllSalaryStructureDetails);
router.get("/:id", getSalaryStructureDetailById);

router.put("/:id", updateSalaryStructureDetail);
router.delete("/:id", deleteSalaryStructureDetail);

export default router;
