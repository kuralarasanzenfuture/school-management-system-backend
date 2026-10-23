import express from "express";
import {
  getNonAdmissionStudents,
  getNonAdmissionStudentsByToken,
  createStudent,
  deleteStudent,
  getAllStudents,
  getAllStudentsByToken,
  getStudentById,
  updateStudent,
  updateStudentStatus,
} from "./student.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { studentDocsUpload } from "../../middlewares/student.upload.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", studentDocsUpload, createStudent);


// NON-ADMISSION / UNADMITTED STUDENTS (MUST be before /:id)
router.get("/non-admissions", getNonAdmissionStudents);
router.get("/non-admissions/token", getNonAdmissionStudentsByToken);
router.get("/unadmitted", getNonAdmissionStudents);
router.get("/unadmitted/token", getNonAdmissionStudentsByToken);

// GET
router.get("/", getAllStudents);
router.get("/token", getAllStudentsByToken);
router.get("/:id", getStudentById);

// UPDATE
router.put("/:id", studentDocsUpload, updateStudent);

// STATUS TOGGLE
router.patch("/status/:id", updateStudentStatus);

// DELETE
router.delete("/:id", deleteStudent);

export default router;
