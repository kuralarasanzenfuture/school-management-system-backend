import express from "express";
import roleRoutes from "./roles.routes.js";
import userRoutes from "./users.routes.js";
import schoolRoutes from "./school.routes.js";
import departmentRoutes from "./department.routes.js";
import academicYearRoutes from "./academicYear.routes.js";
import classRoutes from "./class.routes.js";
import sectionRoutes from "./section.routes.js";
import studentRoutes from "./student.routes.js";
import studentAdmissionRoutes from "./studentAdmission.routes.js";

const router = express.Router();


router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/schools", schoolRoutes);
router.use("/departments", departmentRoutes);
router.use("/academic-years", academicYearRoutes);
router.use("/classes", classRoutes);
router.use("/sections", sectionRoutes);
router.use("/students", studentRoutes);
router.use("/student-admissions", studentAdmissionRoutes);

export default router;
