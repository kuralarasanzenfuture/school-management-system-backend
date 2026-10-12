import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  updateClassStatus,
  deleteClass,
  getAllClassesSchoolId,
  getAllClassesByToken,
  checkExistingClass,
  checkExistingClassByToken,
} from "./class.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createClass);

// GET
router.get("/", getAllClasses);

router.get("/token", getAllClassesByToken);

router.get("/check-class", checkExistingClass);

router.get("/check-class/token", checkExistingClassByToken);

router.get("/school/:school_id", getAllClassesSchoolId);

router.get("/:id", getClassById);

// UPDATE
router.put("/:id", updateClass);

// STATUS TOGGLE
router.patch("/status/:id", updateClassStatus);

// DELETE
router.delete("/:id", deleteClass);

export default router;
