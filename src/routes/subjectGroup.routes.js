import express from "express";
import {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  deleteSubjectGroup,
  getAllSubjectGroupsByToken,
  checkExistingSubjectGroup,
} from "../modules/subjectGroup/subjectGroup.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createSubjectGroup);
router.get("/", getAllSubjectGroups);
router.get("/token", verifyToken, getAllSubjectGroupsByToken);
router.get("/check-subject-group", checkExistingSubjectGroup);
router.get("/:id", getSubjectGroupById);
router.put("/:id", updateSubjectGroup);
router.delete("/:id", deleteSubjectGroup);

export default router;
