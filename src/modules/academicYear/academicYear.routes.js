import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  createAcademicYear,
  deleteAcademicYear,
  getAcademicYearById,
  getAllAcademicYears,
  getAllAcademicYearsByToken,
  getAcademicYearsBySchool,
  updateAcademicYear,
  updateAcademicYearStatus,
  checkExistingAcademicYear,
  checkExistingAcademicYearByToken,
} from "./academicYear.controller.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createAcademicYear);

// GET
router.get("/", getAllAcademicYears);

router.get("/token", getAllAcademicYearsByToken);

router.get("/check-year", checkExistingAcademicYear);

router.get("/check-year/token", checkExistingAcademicYearByToken);

router.get("/school/:school_id", getAcademicYearsBySchool);

router.get("/:id", getAcademicYearById);

// UPDATE
router.put("/:id", updateAcademicYear);

// STATUS TOGGLE
router.patch("/status/:id", updateAcademicYearStatus);

// DELETE
router.delete("/:id", deleteAcademicYear);

export default router;
