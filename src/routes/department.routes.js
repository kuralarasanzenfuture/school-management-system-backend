import express from "express";
import * as DepartmentController from "../modules/departments/department.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// CREATE
router.post("/", DepartmentController.createDepartment);

// GET
router.get("/", DepartmentController.getAllDepartments);
router.get("/school/:school_id", DepartmentController.getDepartmentsBySchool);

// UPDATE
router.put("/:id", DepartmentController.updateDepartment);

// DELETE
router.delete("/:id", DepartmentController.deleteDepartment);

export default router;