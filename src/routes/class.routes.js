import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getAllClassesSchoolId,
  getAllClassesByToken,
  checkExistingClass,
  checkExistingClassByToken,
} from "../modules/classes/class.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createClass);
router.get("/", getAllClasses);
router.get("/token", verifyToken, getAllClassesByToken);
router.get("/school/:school_id", getAllClassesSchoolId);
router.get("/check-class", checkExistingClass);
router.get("/check-class/token", verifyToken, checkExistingClassByToken);
router.get("/:id", getClassById);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

export default router;
