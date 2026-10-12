import express from "express";
import {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  updateSubjectGroupStatus,
  deleteSubjectGroup,
  getAllSubjectGroupsByToken,
  checkExistingSubjectGroup,
  checkExistingSubjectGroupByToken,
} from "./subjectGroup.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createSubjectGroup);

// GET
router.get("/", getAllSubjectGroups);
router.get("/token", getAllSubjectGroupsByToken);
router.get("/check-subject-group", checkExistingSubjectGroup);
router.get("/check-subject-group/token", checkExistingSubjectGroupByToken);
router.get("/:id", getSubjectGroupById);

// UPDATE
router.put("/:id", updateSubjectGroup);

// STATUS TOGGLE
router.patch("/status/:id", updateSubjectGroupStatus);

// DELETE
router.delete("/:id", deleteSubjectGroup);

export default router;
