import express from "express";
import {
  createClassSection,
  getAllClassSections,
  getClassSectionById,
  updateClassSection,
  deleteClassSection,
} from "../modules/class_sections/class_section.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createClassSection);
router.get("/", getAllClassSections);
router.get("/:id", getClassSectionById);
router.put("/:id", updateClassSection);
router.delete("/:id", deleteClassSection);

export default router;
