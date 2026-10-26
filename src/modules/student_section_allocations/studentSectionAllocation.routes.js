import express from "express";
import {
  createSectionAllocation,
  getAllSectionAllocations,
  getAllSectionAllocationsByToken,
  checkExistingSectionAllocation,
  checkExistingSectionAllocationByToken,
  getSectionAllocationById,
  updateSectionAllocation,
  deleteSectionAllocation,
  bulkCreateSectionAllocations,
  getClassStudentsForAllocation,
  getSectionAllocationHistory,
} from "./studentSectionAllocation.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// CREATE
router.post("/", createSectionAllocation);
router.post("/bulk", bulkCreateSectionAllocations);

// GET ALL & TOKEN BASED
router.get("/", getAllSectionAllocations);
router.get("/token", getAllSectionAllocationsByToken);
router.get("/class-students", getClassStudentsForAllocation);

// HISTORY ROUTES
router.get("/history", getSectionAllocationHistory);
router.get("/history/:admissionId", getSectionAllocationHistory);

// CHECK ALLOCATION
router.get("/check-allocation", checkExistingSectionAllocation);
router.get("/check-allocation/token", checkExistingSectionAllocationByToken);

// GET BY ID (MUST be placed after /token and other static routes)
router.get("/:id", getSectionAllocationById);

// UPDATE & DELETE
router.put("/:id", updateSectionAllocation);
router.delete("/:id", deleteSectionAllocation);

export default router;
