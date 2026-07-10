import express from "express";
import roleRoutes from "./roles.routes.js";
import userRoutes from "./users.routes.js";
import schoolRoutes from "./school.routes.js";
import departmentRoutes from "./department.routes.js";
import academicYearRoutes from "./academicYear.routes.js";
import classRoutes from "./class.routes.js";
import sectionRoutes from "./section.routes.js";
import classSectionRoutes from "./class_section.routes.js";
import studentRoutes from "./student.routes.js";
import studentAdmissionRoutes from "./studentAdmission.routes.js";

import employeeDesignationRoutes from "./employee_designations.routes.js";
import employeeRoutes from "./employee.routes.js";
import subjectRoutes from "./subject.routes.js";
import subjectGroupRoutes from "./subjectGroup.routes.js";
import classSubjectRoutes from "./classSubject.routes.js";

const router = express.Router();


router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/schools", schoolRoutes);
router.use("/departments", departmentRoutes);
router.use("/academic-years", academicYearRoutes);
router.use("/classes", classRoutes);
router.use("/sections", sectionRoutes);
router.use("/class-sections", classSectionRoutes);
router.use("/subjects", subjectRoutes);
router.use("/subject-groups", subjectGroupRoutes);
router.use("/class-subjects", classSubjectRoutes);
router.use("/students", studentRoutes);
router.use("/student-admissions", studentAdmissionRoutes);

router.use("/employees-designations", employeeDesignationRoutes);
router.use("/employees", employeeRoutes);

export default router;
