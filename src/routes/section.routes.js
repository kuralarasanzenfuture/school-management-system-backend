import express from "express";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  getAllSectionsClassId,
  getSchoolTree,
  getAllSectionsByToken,
  checkExistingSection,
} from "../modules/sections/section.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createSection);
router.get("/", getAllSections);
router.get("/token", verifyToken, getAllSectionsByToken);
router.get("/tree", getSchoolTree);
router.get("/check-section", checkExistingSection);
router.get("/class", getAllSectionsClassId); // query
router.get("/class/:class_id", getAllSectionsClassId); // params
router.get("/:id", getSectionById);
router.put("/:id", updateSection);
router.delete("/:id", deleteSection);

export default router;
