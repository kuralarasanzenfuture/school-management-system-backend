import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { createAcademicYear, deleteAcademicYear, getAcademicYearById, getAllAcademicYears, updateAcademicYear } from "../modules/academicYear/academicYear.controller.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createAcademicYear);
router.get("/", getAllAcademicYears);
router.get("/:id", getAcademicYearById);
router.put("/:id", updateAcademicYear);
router.delete("/:id", deleteAcademicYear);

export default router;
