// import { initDB } from "../config/db.js";
// import { seedRoles } from "./seeds/roles.seed.js";

// const runSeeds = async () => {
//   try {
//     await initDB();

//     console.log("🌱 Running seeds...");

//     await seedRoles();

//     console.log("✅ Seeding completed");
//     process.exit();

//   } catch (err) {
//     console.error("❌ Seeding failed:", err.message);
//     process.exit(1);
//   }
// };

// export default runSeeds;

// // allow CLI run
// if (process.argv[1].includes("runSeeds.js")) {
//   runSeeds();
// }

import { initDB } from "../config/db.js";
import { seedAcademicYears } from "./seeds/academicYear.seed.js";
import { seedClasses } from "./seeds/class.seed.js";
import { seedClassSections } from "./seeds/ClassSections.seed.js";
import { seedClassSubjects } from "./seeds/classSubject.seed.js";
import { seedDepartments } from "./seeds/department.seed.js";
import { seedEmployees } from "./seeds/employee.seed.js";
import { seedEmployeeDesignations } from "./seeds/employee_designation.seed.js";
import { seedEmployeeShifts } from "./seeds/employeeShift.seed.js";
import { seedRoles } from "./seeds/roles.seed.js";
import { seedSchools } from "./seeds/school.seed.js";
import { seedSections } from "./seeds/section.seed.js";
import { seedStudents } from "./seeds/students.seed.js";
import { seedSubjects } from "./seeds/subject.seed.js";
import { seedSubjectGroups } from "./seeds/subjectGroup.seed.js";
import { seedUsers } from "./seeds/users.seed.js";

const runSeeds = async () => {
  try {
    await initDB();

    console.log("🌱 Running seeds...");
    await seedSchools();
    await seedRoles();
    await seedUsers();

    await seedDepartments();
    await seedClasses();
    await seedSections();
    await seedAcademicYears();
    await seedStudents();

    await seedClassSections();
    await seedSubjects();
    await seedSubjectGroups();
    await seedEmployees();
    await seedClassSubjects();

    await seedEmployeeShifts();

    await seedEmployeeDesignations();

    console.log("✅ Seeding completed");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    throw err; // Let server.js handle the error
  }
};

export default runSeeds;

// Allow CLI execution only
if (process.argv[1]?.includes("runSeeds.js")) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
