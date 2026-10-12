import express from "express";
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
} from "./classSubject.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE & BULK
router.post("/", createClassSubject);
router.post("/bulk-assign-subjects", bulkAssignSubjects);

// CHECK & TOKEN GETs
router.get("/check-class-subject", checkExistingClassSubject);
router.get("/token", getAllClassSubjectsByToken);
router.get("/detailed", getAllClassSubjectsDetailed);

// STANDARD GET / UPDATE / DELETE
router.get("/", getAllClassSubjects);
router.get("/:id", getClassSubjectById);

router.put("/:id", updateClassSubject);
router.delete("/:id", deleteClassSubject);

export default router;
