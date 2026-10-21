import express from "express";
import {
  createSalaryStructure,
  getAllSalaryStructures,
  getAllSalaryStructuresByToken,
  getSalaryStructureById,
  updateSalaryStructure,
  updateSalaryStructureStatus,
  deleteSalaryStructure,
} from "./employeeSalaryStructure.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createSalaryStructure);
router.get("/", getAllSalaryStructures);
router.get("/token", getAllSalaryStructuresByToken);
router.get("/:id", getSalaryStructureById);
router.put("/:id", updateSalaryStructure);
router.patch("/status/:id", updateSalaryStructureStatus);
router.delete("/:id", deleteSalaryStructure);

export default router;
