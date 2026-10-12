import express from "express";
import {
  createClassSection,
  getAllClassSections,
  getClassSectionById,
  updateClassSection,
  updateClassSectionStatus,
  deleteClassSection,
  getAllClassSectionsByToken,
  checkExistingClassSection,
  checkExistingClassSectionByToken,
} from "./class_section.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createClassSection);

// GET
router.get("/", getAllClassSections);

router.get("/token", getAllClassSectionsByToken);

router.get("/check-mapping", checkExistingClassSection);

router.get("/check-mapping/token", checkExistingClassSectionByToken);

router.get("/:id", getClassSectionById);

// UPDATE
router.put("/:id", updateClassSection);

// STATUS TOGGLE
router.patch("/status/:id", updateClassSectionStatus);

// DELETE
router.delete("/:id", deleteClassSection);

export default router;
