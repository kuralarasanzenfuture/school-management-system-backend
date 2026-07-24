import express from "express";
import {
  createStudentAdmission,
  deleteStudentAdmission,
  getAllStudentAdmissions,
  getStudentAdmissionById,
  updateStudentAdmission,
  getAllStudentAdmissionsByToken,
  getClassStudentSummaryByToken,
} from "../modules/studentAdmissions/studentAdmission.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createStudentAdmission);
router.get("/", getAllStudentAdmissions);
router.get("/token", verifyToken, getAllStudentAdmissionsByToken);
router.get("/token/class-summary", verifyToken, getClassStudentSummaryByToken);
router.get("/:id", getStudentAdmissionById);
router.put("/:id", updateStudentAdmission);
router.delete("/:id", deleteStudentAdmission);

export default router;
