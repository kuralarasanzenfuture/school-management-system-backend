import express from "express";
import * as DepartmentController from "../modules/departments/department.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

// CREATE
router.post("/", DepartmentController.createDepartment);

// GET
router.get("/", DepartmentController.getAllDepartments);

router.get(
  "/token",
  verifyToken,
  DepartmentController.getAllDepartmentsByToken,
);

router.get("/check-department", DepartmentController.checkExistingDepartment);

router.get("/school/:school_id", DepartmentController.getDepartmentsBySchool);

router.get("/:id", DepartmentController.getDepartmentById);

// UPDATE
router.put("/:id", DepartmentController.updateDepartment);

// DELETE
router.delete("/:id", DepartmentController.deleteDepartment);

export default router;
