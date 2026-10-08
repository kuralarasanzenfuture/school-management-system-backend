import express from "express";
import roleRoutes from "../modules/roles/role.routes.js";
import userRoutes from "../modules/users/users.routes.js";
import schoolRoutes from "../modules/schools/school.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import academicYearRoutes from "../modules/academicYear/academicYear.routes.js";
import classRoutes from "../modules/classes/class.routes.js";
import sectionRoutes from "../modules/sections/section.routes.js";
import classSectionRoutes from "../modules/class_sections/class_section.routes.js";
import studentRoutes from "../modules/students/student.routes.js";
import studentAdmissionRoutes from "../modules/studentAdmissions/studentAdmission.routes.js";
import studentAttendanceRoutes from "../modules/studentAttendance/studentAttendance.routes.js";

import employeeDesignationRoutes from "../modules/employees/designations/employee_designations.routes.js";
import employeeRoutes from "../modules/employees/employee/employee.routes.js";
import subjectRoutes from "../modules/subject/subject.routes.js";
import subjectGroupRoutes from "../modules/subjectGroup/subjectGroup.routes.js";
import classSubjectRoutes from "../modules/class_subject-new/classSubject.routes.js";
import employeeShiftRoutes from "../modules/employeeShift/employeeShift.routes.js";
import employeeAttendanceRoutes from "../modules/employeeAttendance/employeeAttendance.routes.js";
import employeeLeaveTypeRoutes from "../modules/employees/employeeLeaveTypes/employeeLeaveType.routes.js";
import employeeSalaryComponentRoutes from "../modules/employee_salary_component/employeeSalaryComponent.routes.js";
import employeeSalaryStructureRoutes from "../modules/employee_salary_structure/employeeSalaryStructure.routes.js";
import employeeSalaryStructureDetailsRoutes from "../modules/employee_salary_structure_details/employeeSalaryStructureDetail.routes.js";
import employeeSalaryStructureWithDetailRoutes from "../modules/employee_salary_structureAndDetail/employeeSalaryStructureWithDetail.routes.js";

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
router.use("/students-attendance", studentAttendanceRoutes);

router.use("/employees-designations", employeeDesignationRoutes);
router.use("/employees", employeeRoutes);
router.use("/employee-shifts", employeeShiftRoutes);
router.use("/employee-attendance", employeeAttendanceRoutes);
router.use("/employees-leave-types", employeeLeaveTypeRoutes);
router.use("/employee-salary-components", employeeSalaryComponentRoutes);
router.use("/employee-salary-structures", employeeSalaryStructureRoutes);
router.use("/employee-salary-structures-details", employeeSalaryStructureDetailsRoutes);
router.use("/employee-salary-structures-with-details", employeeSalaryStructureWithDetailRoutes);
router.use("/employee-salary-structure-with-details", employeeSalaryStructureWithDetailRoutes);

export default router;
