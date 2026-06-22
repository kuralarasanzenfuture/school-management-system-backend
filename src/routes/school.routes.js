import express from "express";
import {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool
} from "../modules/schools/school.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =========================
   SCHOOL CRUD
========================= */

// 🔐 Create School (ADMIN only ideally)
router.post("/", createSchool);

// 🔐 Get all schools
router.get("/", getAllSchools);

// 🔐 Get single school
router.get("/:id", getSchoolById);

// 🔐 Update school
router.put("/:id", updateSchool);

// 🔐 Delete school
router.delete("/:id", deleteSchool);

export default router;