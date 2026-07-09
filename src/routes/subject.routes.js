import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getAllSubjectsByToken,
  checkExistingSubject,
} from "../modules/subject/subject.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createSubject);
router.get("/", getAllSubjects);
router.get("/token", verifyToken, getAllSubjectsByToken);
router.get("/check-subject", checkExistingSubject);
router.get("/:id", getSubjectById);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
