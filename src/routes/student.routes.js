import express from "express";
import {
  createStudent,
  deleteStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
} from "../modules/students/student.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { studentDocsUpload } from "../middlewares/student.upload.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", studentDocsUpload, createStudent);
router.get("/", getAllStudents);
router.get("/:id", getStudentById);
router.put("/:id", studentDocsUpload, updateStudent);
router.delete("/:id", deleteStudent);

export default router;
