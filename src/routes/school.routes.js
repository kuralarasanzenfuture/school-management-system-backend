import express from "express";
import {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getAllSchoolsByToken,
} from "../modules/schools/school.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { schoolUpload } from "../middlewares/school.upload.js";

const router = express.Router();

/* =========================
   SCHOOL CRUD
========================= */

// router.use(verifyToken);

// 🔐 Create School (ADMIN only ideally)
router.post("/", schoolUpload, createSchool);

// 🔐 Get all schools
router.get("/", getAllSchools);

router.get("/token", verifyToken, getAllSchoolsByToken);

// 🔐 Get single school
router.get("/:id", getSchoolById);

// 🔐 Update school
router.put("/:id", schoolUpload, updateSchool);

// 🔐 Delete school
router.delete("/:id", deleteSchool);

export default router;
