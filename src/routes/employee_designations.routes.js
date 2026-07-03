import express from "express";
import {
    createEmployeeDesignation,
    getAllEmployeeDesignations,
    getEmployeeDesignationById,
    updateEmployeeDesignation,
    deleteEmployeeDesignation,
} from "../modules/employees/designations/employee_designations.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);

router.post("/", createEmployeeDesignation);
router.get("/", getAllEmployeeDesignations);
router.get("/:id", getEmployeeDesignationById);
router.put("/:id", updateEmployeeDesignation);
router.delete("/:id", deleteEmployeeDesignation);

export default router;