import express from "express";
// import {
//   createClassSubject,
//   getAllClassSubjects,
//   getClassSubjectById,
//   updateClassSubject,
//   deleteClassSubject,
//   getAllClassSubjectsByToken,
//   checkExistingClassSubject,
//   getAllClassSubjectsDetailed,
//   bulkAssignSubjects,
// } from "../modules/class_subject/classSubject.controller.js";
import {
  createClassSubject,
  getAllClassSubjects,
  getClassSubjectById,
  updateClassSubject,
  deleteClassSubject,
  getAllClassSubjectsByToken,
  checkExistingClassSubject,
  getAllClassSubjectsDetailed,
  bulkAssignSubjects,
} from "../modules/class_subject-new/classSubject.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createClassSubject);

router.get("/check-class-subject", checkExistingClassSubject);
router.get("/token", verifyToken, getAllClassSubjectsByToken);

router.get("/detailed", verifyToken, getAllClassSubjectsDetailed);
router.post("/bulk-assign-subjects", bulkAssignSubjects);

router.get("/", getAllClassSubjects);
router.get("/:id", getClassSubjectById);

router.put("/:id", updateClassSubject);
router.delete("/:id", deleteClassSubject);

export default router;
