import { getNonAdmissionStudents, getNonAdmissionStudentsByToken } from "../students/student.controller.js";
import express from "express";
import {
  createStudentAdmission,
  deleteStudentAdmission,
  getAllStudentAdmissions,
  getStudentAdmissionById,
  updateStudentAdmission,
  getAllStudentAdmissionsByToken,
  getClassStudentSummaryByToken,
  getAllStudentAdmissionsReport,
} from "./studentAdmission.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createStudentAdmission);
router.get("/", getAllStudentAdmissions);
// NON-ADMISSIONS STUDENTS
router.get("/non-admissions-students", getNonAdmissionStudents);
router.get("/non-admissions-students/token", verifyToken, getNonAdmissionStudentsByToken);

router.get("/token", verifyToken, getAllStudentAdmissionsByToken);
router.get("/token/class-summary", verifyToken, getClassStudentSummaryByToken);
router.get("/report", verifyToken, getAllStudentAdmissionsReport);
router.get("/:id", getStudentAdmissionById);
router.put("/:id", updateStudentAdmission);
router.delete("/:id", deleteStudentAdmission);

export default router;
