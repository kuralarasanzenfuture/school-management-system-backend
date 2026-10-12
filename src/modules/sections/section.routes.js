import express from "express";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  updateSectionStatus,
  deleteSection,
  getAllSectionsClassId,
  getSchoolTree,
  getAllSectionsByToken,
  checkExistingSection,
  checkExistingSectionByToken,
} from "./section.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createSection);

// GET
router.get("/", getAllSections);

router.get("/token", getAllSectionsByToken);

router.get("/tree", getSchoolTree);

router.get("/check-section", checkExistingSection);

router.get("/check-section/token", checkExistingSectionByToken);

router.get("/class", getAllSectionsClassId);

router.get("/class/:class_id", getAllSectionsClassId);

router.get("/:id", getSectionById);

// UPDATE
router.put("/:id", updateSection);

// STATUS TOGGLE
router.patch("/status/:id", updateSectionStatus);

// DELETE
router.delete("/:id", deleteSection);

export default router;
