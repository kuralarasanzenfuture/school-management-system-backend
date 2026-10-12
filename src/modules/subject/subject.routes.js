import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  updateSubjectStatus,
  deleteSubject,
  getAllSubjectsByToken,
  checkExistingSubject,
  checkExistingSubjectByToken,
} from "./subject.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createSubject);

// GET
router.get("/", getAllSubjects);
router.get("/token", getAllSubjectsByToken);
router.get("/check-subject", checkExistingSubject);
router.get("/check-subject/token", checkExistingSubjectByToken);
router.get("/:id", getSubjectById);

// UPDATE
router.put("/:id", updateSubject);

// STATUS TOGGLE
router.patch("/status/:id", updateSubjectStatus);

// DELETE
router.delete("/:id", deleteSubject);

export default router;
