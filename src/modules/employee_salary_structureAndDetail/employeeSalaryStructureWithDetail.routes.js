import express from "express";
import { createSalaryStructureWithDetails } from "./employeeSalaryStructureWithDetail.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createSalaryStructureWithDetails);

export default router;
