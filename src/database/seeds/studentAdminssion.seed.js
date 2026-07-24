// import { getDB } from "../../config/db.js";

// export const seedStudentAdmissions = async () => {
//   const db = getDB();
//   const currentYear = new Date().getFullYear();

//   console.log("🚀 Starting Student Admissions Seeder...");

//   // 1. Fetch all schools
//   const [schools] = await db.query("SELECT id FROM schools");
//   if (!schools.length) {
//     console.log("⚠️ No schools found. Please seed schools first.");
//     return;
//   }

//   const batchSize = 1000;

//   for (const school of schools) {
//     const schoolId = school.id;
//     console.log(`\n⏳ Processing School ID: ${schoolId}...`);

//     // 2. Fetch the active academic year for this school
//     const [academicYears] = await db.query(
//       `SELECT id, name FROM academic_years WHERE school_id = ? AND is_current = TRUE LIMIT 1`,
//       [schoolId]
//     );

//     if (!academicYears.length) {
//       console.log(`⚠️ No active academic year found for School ID: ${schoolId}. Skipping...`);
//       continue;
//     }

//     const activeYear = academicYears[0];

//     // 3. Fetch active classes for this school
//     const [classes] = await db.query(
//       `SELECT id, name FROM classes WHERE school_id = ? AND status = 'active'`,
//       [schoolId]
//     );

//     if (!classes.length) {
//       console.log(`⚠️ No classes found for School ID: ${schoolId}. Skipping...`);
//       continue;
//     }

//     // 4. Fetch sections associated with classes for this school & academic year
//     const [classSections] = await db.query(
//       `SELECT cs.class_id, cs.section_id, c.name AS class_name, s.name AS section_name
//        FROM class_sections cs
//        JOIN classes c ON cs.class_id = c.id
//        JOIN sections s ON cs.section_id = s.id
//        WHERE cs.school_id = ? AND cs.academic_year_id = ? AND cs.status = 'active'`,
//       [schoolId, activeYear.id]
//     );

//     // Fallback default sections if class_sections mapping table isn't populated yet
//     const sectionNames = ["A", "B", "C", "D"];

//     // 5. Fetch all students belonging to this school who are not yet admitted in this academic year
//     const [students] = await db.query(
//       `SELECT s.id, s.created_at
//        FROM students s
//        LEFT JOIN student_admissions sa
//          ON s.id = sa.student_id AND sa.academic_year_id = ?
//        WHERE s.school_id = ? AND sa.id IS NULL`,
//       [activeYear.id, schoolId]
//     );

//     if (!students.length) {
//       console.log(`ℹ️ All students in School ID ${schoolId} already have admission records.`);
//       continue;
//     }

//     // 6. Get the starting sequence for admission_number
//     const [lastAdmission] = await db.query(
//       `SELECT admission_number FROM student_admissions ORDER BY id DESC LIMIT 1`
//     );

//     let nextNumber = 1;
//     if (lastAdmission.length && lastAdmission[0].admission_number) {
//       const parts = lastAdmission[0].admission_number.split("-");
//       if (parts.length === 3) {
//         nextNumber = parseInt(parts[2], 10) + 1;
//       }
//     }

//     console.log(`📌 Found ${students.length} unassigned students in School ID ${schoolId}. Creating admissions...`);

//     let admissionBatch = [];
//     let count = 0;

//     await db.query("START TRANSACTION");

//     try {
//       for (let i = 0; i < students.length; i++) {
//         const student = students[i];

//         // Evenly distribute students across available classes
//         const targetClass = classes[i % classes.length];

//         // Determine section name
//         let sectionName = "A";
//         const matchingClassSections = classSections.filter(cs => cs.class_id === targetClass.id);
//         if (matchingClassSections.length > 0) {
//           sectionName = matchingClassSections[i % matchingClassSections.length].section_name;
//         } else {
//           sectionName = sectionNames[i % sectionNames.length];
//         }

//         // Generate unique admission number and roll number
//         const admissionNumber = `ADM-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
//         nextNumber++;

//         const rollNo = String((Math.floor(i / classes.length) % 50) + 1).padStart(2, "0");
//         const joiningDate = student.created_at ? new Date(student.created_at).toISOString().split("T")[0] : `${currentYear}-06-01`;

//         admissionBatch.push([
//           student.id,
//           admissionNumber,
//           joiningDate, // admission_date
//           activeYear.id,
//           activeYear.name,
//           targetClass.id,
//           targetClass.name,
//           sectionName,
//           rollNo,
//           joiningDate, // joining_date
//           null,        // subject_group
//           i % 3 === 0, // transport_required (every 3rd student)
//           i % 7 === 0, // hostel_required (every 7th student)
//           "new",       // admission_type
//           "active"     // status
//         ]);

//         count++;

//         // Batch execution when limit reached or loop completes
//         if (admissionBatch.length === batchSize || i === students.length - 1) {
//           const sql = `
//             INSERT INTO student_admissions (
//               student_id,
//               admission_number,
//               admission_date,
//               academic_year_id,
//               academic_year,
//               class_id,
//               class_name,
//               section,
//               roll_no,
//               joining_date,
//               subject_group,
//               transport_required,
//               hostel_required,
//               admission_type,
//               status
//             ) VALUES ?`;

//           await db.query(sql, [admissionBatch]);
//           console.log(`  ✓ Inserted batch (${count} / ${students.length}) for School ID ${schoolId}`);
//           admissionBatch = [];
//         }
//       }

//       await db.query("COMMIT");
//       console.log(`✅ Successfully inserted ${count} admission records for School ID ${schoolId}.`);
//     } catch (err) {
//       await db.query("ROLLBACK");
//       console.error(`❌ Error seeding admissions for School ID ${schoolId}:`, err);
//     }
//   }

//   console.log("\n🎉 All student admissions seeded successfully!");
// };

/*============== with school_id ================*/

// import { getDB } from "../../config/db.js";

// export const seedStudentAdmissions = async () => {
//   const db = getDB();
//   const currentYear = new Date().getFullYear();

//   console.log("🚀 Starting Student Admissions Seeder...");

//   // 1. Fetch all distinct schools present in the database
//   const [schools] = await db.query("SELECT DISTINCT id FROM schools");
//   if (!schools.length) {
//     console.log(
//       "⚠️ No schools found in the database. Please seed schools first.",
//     );
//     return;
//   }

//   const batchSize = 1000;

//   for (const school of schools) {
//     const schoolId = school.id;
//     console.log(`\n⏳ Processing School ID: ${schoolId}...`);

//     // 2. Fetch active academic year for this school
//     const [academicYears] = await db.query(
//       `SELECT id, name FROM academic_years WHERE school_id = ? AND is_current = TRUE LIMIT 1`,
//       [schoolId],
//     );

//     if (!academicYears.length) {
//       console.log(
//         `⚠️ No active academic year found for School ID ${schoolId}. Skipping...`,
//       );
//       continue;
//     }

//     const activeYear = academicYears[0];

//     // 3. Fetch active classes for this school
//     const [classes] = await db.query(
//       `SELECT id, name FROM classes WHERE school_id = ? AND status = 'active'`,
//       [schoolId],
//     );

//     if (!classes.length) {
//       console.log(
//         `⚠️ No active classes found for School ID ${schoolId}. Skipping...`,
//       );
//       continue;
//     }

//     // 4. Fetch mapped section names via class_sections (if configured)
//     const [classSections] = await db.query(
//       `SELECT cs.class_id, cs.section_id, c.name AS class_name, s.name AS section_name
//        FROM class_sections cs
//        JOIN classes c ON cs.class_id = c.id
//        JOIN sections s ON cs.section_id = s.id
//        WHERE cs.school_id = ? AND cs.academic_year_id = ? AND cs.status = 'active'`,
//       [schoolId, activeYear.id],
//     );

//     const defaultSections = ["A", "B", "C", "D"];

//     // 5. Fetch students belonging to this school who do NOT have an admission record for this year
//     const [unassignedStudents] = await db.query(
//       `SELECT s.id AS student_id, s.school_id, s.created_at
//        FROM students s
//        LEFT JOIN student_admissions sa
//          ON s.id = sa.student_id AND sa.academic_year_id = ?
//        WHERE s.school_id = ? AND sa.id IS NULL`,
//       [activeYear.id, schoolId],
//     );

//     if (!unassignedStudents.length) {
//       console.log(
//         `ℹ️ All students in School ID ${schoolId} already have active admissions.`,
//       );
//       continue;
//     }

//     // 6. Calculate starting counter for global unique admission_number
//     const [lastAdmission] = await db.query(
//       `SELECT admission_number FROM student_admissions ORDER BY id DESC LIMIT 1`,
//     );

//     let nextNumber = 1;
//     if (lastAdmission.length && lastAdmission[0].admission_number) {
//       const parts = lastAdmission[0].admission_number.split("-");
//       if (parts.length === 3 && !isNaN(parseInt(parts[2], 10))) {
//         nextNumber = parseInt(parts[2], 10) + 1;
//       }
//     }

//     console.log(
//       `📌 Found ${unassignedStudents.length} unassigned students for School ID ${schoolId}. Generating admissions...`,
//     );

//     let admissionBatch = [];
//     let count = 0;

//     await db.query("START TRANSACTION");

//     try {
//       for (let i = 0; i < unassignedStudents.length; i++) {
//         const student = unassignedStudents[i];

//         // Evenly balance class and section assignments
//         const targetClass = classes[i % classes.length];
//         const matchingSections = classSections.filter(
//           (cs) => cs.class_id === targetClass.id,
//         );
//         const sectionName =
//           matchingSections.length > 0
//             ? matchingSections[i % matchingSections.length].section_name
//             : defaultSections[i % defaultSections.length];

//         const admissionNumber = `ADM-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
//         nextNumber++;

//         const rollNo = String(
//           (Math.floor(i / classes.length) % 50) + 1,
//         ).padStart(2, "0");
//         const joiningDate = student.created_at
//           ? new Date(student.created_at).toISOString().split("T")[0]
//           : `${currentYear}-06-01`;

//         admissionBatch.push([
//           student.school_id, // school_id directly from students table
//           student.student_id,
//           admissionNumber,
//           joiningDate, // admission_date
//           activeYear.id, // academic_year_id
//           activeYear.name, // academic_year
//           targetClass.id, // class_id
//           targetClass.name, // class_name
//           sectionName, // section
//           rollNo, // roll_no
//           joiningDate, // joining_date
//           null, // subject_group
//           i % 3 === 0, // transport_required
//           i % 7 === 0, // hostel_required
//           "new", // admission_type
//           "active", // status
//         ]);

//         count++;

//         // Execute batch insert when threshold is hit or on final iteration
//         if (
//           admissionBatch.length === batchSize ||
//           i === unassignedStudents.length - 1
//         ) {
//           const sql = `
//             INSERT INTO student_admissions (
//               school_id,
//               student_id,
//               admission_number,
//               admission_date,
//               academic_year_id,
//               academic_year,
//               class_id,
//               class_name,
//               section,
//               roll_no,
//               joining_date,
//               subject_group,
//               transport_required,
//               hostel_required,
//               admission_type,
//               status
//             ) VALUES ?`;

//           await db.query(sql, [admissionBatch]);
//           console.log(
//             `  ✓ Seeded ${count} / ${unassignedStudents.length} admissions for School ID ${schoolId}`,
//           );
//           admissionBatch = [];
//         }
//       }

//       await db.query("COMMIT");
//       console.log(
//         `✅ Successfully completed seeding admissions for School ID ${schoolId}.`,
//       );
//     } catch (err) {
//       await db.query("ROLLBACK");
//       console.error(
//         `❌ Error seeding admissions for School ID ${schoolId}:`,
//         err,
//       );
//     }
//   }

//   console.log("\n🎉 All student admissions seeded successfully!");
// };

// import { getDB } from "../../config/db.js";

// export const seedStudentAdmissions = async () => {
//   const db = getDB();
//   const currentYear = new Date().getFullYear();

//   console.log("🚀 Starting Multi-School Student Admissions Seeder...");

//   // 1. Fetch all distinct schools
//   const [schools] = await db.query("SELECT id, name FROM schools");

//   if (!schools.length) {
//     console.log("⚠️ No schools found. Please seed schools first.");
//     return;
//   }

//   console.log(`🏫 Found ${schools.length} school(s) to process.`);

//   for (const school of schools) {
//     const schoolId = school.id;
//     console.log(`\n========================================`);
//     console.log(
//       `⏳ Processing School ID: ${schoolId} (${school.name || "Unnamed"})`,
//     );
//     console.log(`========================================`);

//     // 2. Fetch the active academic year specifically for THIS school
//     const [academicYears] = await db.query(
//       `SELECT id, name FROM academic_years WHERE school_id = ? AND is_current = TRUE AND status = 'active' LIMIT 1`,
//       [schoolId],
//     );

//     if (!academicYears.length) {
//       console.log(
//         `⚠️ No active academic year found for School ID ${schoolId}. Skipping...`,
//       );
//       continue;
//     }

//     const activeYear = academicYears[0];

//     // 3. Fetch active classes belonging specifically to THIS school
//     const [classes] = await db.query(
//       `SELECT id, name FROM classes WHERE school_id = ? AND status = 'active'`,
//       [schoolId],
//     );

//     if (!classes.length) {
//       console.log(
//         `⚠️ No active classes found for School ID ${schoolId}. Skipping...`,
//       );
//       continue;
//     }

//     // 4. Fetch class-section associations for THIS school & academic year
//     const [classSections] = await db.query(
//       `SELECT cs.class_id, cs.section_id, c.name AS class_name, s.name AS section_name
//        FROM class_sections cs
//        JOIN classes c ON cs.class_id = c.id
//        JOIN sections s ON cs.section_id = s.id
//        WHERE cs.school_id = ? AND cs.academic_year_id = ? AND cs.status = 'active'`,
//       [schoolId, activeYear.id],
//     );

//     const fallbackSections = ["A", "B", "C", "D"];

//     // 5. Fetch students belonging ONLY to THIS school who don't have an admission for this academic year
//     const [unassignedStudents] = await db.query(
//       `SELECT s.id AS student_id, s.school_id, s.created_at
//        FROM students s
//        LEFT JOIN student_admissions sa
//          ON s.id = sa.student_id AND sa.academic_year_id = ?
//        WHERE s.school_id = ? AND sa.id IS NULL`,
//       [activeYear.id, schoolId],
//     );

//     if (!unassignedStudents.length) {
//       console.log(
//         `ℹ️ All students in School ID ${schoolId} already have admission records for ${activeYear.name}.`,
//       );
//       continue;
//     }

//     // 6. Get starting admission sequence for this school (e.g., SCH1-ADM-2026-00001)
//     const [lastAdmission] = await db.query(
//       `SELECT admission_number FROM student_admissions WHERE school_id = ? ORDER BY id DESC LIMIT 1`,
//       [schoolId],
//     );

//     let nextNumber = 1;
//     if (lastAdmission.length && lastAdmission[0].admission_number) {
//       const parts = lastAdmission[0].admission_number.split("-");
//       const lastSeq = parseInt(parts[parts.length - 1], 10);
//       if (!isNaN(lastSeq)) {
//         nextNumber = lastSeq + 1;
//       }
//     }

//     console.log(
//       `📌 Found ${unassignedStudents.length} unassigned students for School ID ${schoolId}.`,
//     );

//     const batchSize = 1000;
//     let admissionBatch = [];
//     let totalInserted = 0;

//     await db.query("START TRANSACTION");

//     try {
//       for (let i = 0; i < unassignedStudents.length; i++) {
//         const student = unassignedStudents[i];

//         // Assign class in round-robin fashion
//         const targetClass = classes[i % classes.length];

//         // Determine section name
//         const classSectionsForClass = classSections.filter(
//           (cs) => cs.class_id === targetClass.id,
//         );
//         const sectionName =
//           classSectionsForClass.length > 0
//             ? classSectionsForClass[i % classSectionsForClass.length]
//                 .section_name
//             : fallbackSections[i % fallbackSections.length];

//         // Generate school-prefixed unique admission number
//         const admissionNumber = `SCH${schoolId}-ADM-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
//         nextNumber++;

//         // Calculate roll number per class/section group
//         const rollNo = String(
//           (Math.floor(i / classes.length) % 50) + 1,
//         ).padStart(2, "0");
//         const joiningDate = student.created_at
//           ? new Date(student.created_at).toISOString().split("T")[0]
//           : `${currentYear}-06-01`;

//         admissionBatch.push([
//           student.school_id, // school_id from students table
//           student.student_id,
//           admissionNumber,
//           joiningDate, // admission_date
//           activeYear.id,
//           activeYear.name,
//           targetClass.id,
//           targetClass.name,
//           sectionName,
//           rollNo,
//           joiningDate, // joining_date
//           null, // subject_group
//           i % 3 === 0, // transport_required
//           i % 7 === 0, // hostel_required
//           "new", // admission_type
//           "active", // status
//         ]);

//         totalInserted++;

//         // Batch execution
//         if (
//           admissionBatch.length === batchSize ||
//           i === unassignedStudents.length - 1
//         ) {
//           const sql = `
//             INSERT INTO student_admissions (
//               school_id,
//               student_id,
//               admission_number,
//               admission_date,
//               academic_year_id,
//               academic_year,
//               class_id,
//               class_name,
//               section,
//               roll_no,
//               joining_date,
//               subject_group,
//               transport_required,
//               hostel_required,
//               admission_type,
//               status
//             ) VALUES ?`;

//           await db.query(sql, [admissionBatch]);
//           console.log(
//             `  ✓ Inserted ${totalInserted} / ${unassignedStudents.length} records...`,
//           );
//           admissionBatch = [];
//         }
//       }

//       await db.query("COMMIT");
//       console.log(
//         `✅ Completed School ID ${schoolId}: ${totalInserted} admissions created.`,
//       );
//     } catch (err) {
//       await db.query("ROLLBACK");
//       console.error(`❌ Error seeding School ID ${schoolId}:`, err);
//     }
//   }

//   console.log("\n🎉 Multi-school student admissions seeding completed!");
// };

// --------------------------------------------------------------------

import { getDB } from "../../config/db.js";

export const seedStudentAdmissions = async () => {
  const db = getDB();
  const currentYear = new Date().getFullYear();

  console.log(
    "🚀 Starting Realistic Multi-School Student Admissions Seeder...",
  );

  // 1. Fetch all distinct active schools
  const [schools] = await db.query("SELECT id, name FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found. Please seed schools first.");
    return;
  }

  for (const school of schools) {
    const schoolId = school.id;
    console.log(`\n========================================`);
    console.log(
      `⏳ Processing School ID: ${schoolId} (${school.name || "School"})`,
    );
    console.log(`========================================`);

    // 2. Get current active academic year for this specific school
    const [academicYears] = await db.query(
      `SELECT id, name FROM academic_years 
       WHERE school_id = ? AND is_current = TRUE AND status = 'active' 
       LIMIT 1`,
      [schoolId],
    );

    if (!academicYears.length) {
      console.log(
        `⚠️ No active academic year found for School ID ${schoolId}. Skipping...`,
      );
      continue;
    }

    const activeYear = academicYears[0];

    // 3. Fetch structured Class & Section pairs for this School & Academic Year
    // If class_sections is populated, use it. Otherwise, join classes and sections directly.
    const [classSections] = await db.query(
      `SELECT 
         c.id AS class_id, 
         c.name AS class_name, 
         s.id AS section_id, 
         s.name AS section_name
       FROM class_sections cs
       JOIN classes c ON cs.class_id = c.id
       JOIN sections s ON cs.section_id = s.id
       WHERE cs.school_id = ? AND cs.academic_year_id = ? AND cs.status = 'active' AND c.status = 'active'
       ORDER BY c.id ASC, s.id ASC`,
      [schoolId, activeYear.id],
    );

    // Fallback: If class_sections mapping table is empty, construct from active classes and default sections A-D
    let targetSlots = classSections;
    if (!targetSlots.length) {
      const [classes] = await db.query(
        `SELECT id AS class_id, name AS class_name FROM classes WHERE school_id = ? AND status = 'active' ORDER BY id ASC`,
        [schoolId],
      );

      const defaultSections = ["A", "B", "C", "D"];
      targetSlots = [];

      for (const cls of classes) {
        for (const secName of defaultSections) {
          targetSlots.push({
            class_id: cls.class_id,
            class_name: cls.class_name,
            section_id: null,
            section_name: secName,
          });
        }
      }
    }

    if (!targetSlots.length) {
      console.log(
        `⚠️ No active classes/sections found for School ID ${schoolId}. Skipping...`,
      );
      continue;
    }

    // 4. Fetch students belonging to this school with NO existing admission in the current academic year
    const [unassignedStudents] = await db.query(
      `SELECT s.id AS student_id, s.school_id, s.created_at 
       FROM students s
       LEFT JOIN student_admissions sa 
         ON s.id = sa.student_id AND sa.academic_year_id = ?
       WHERE s.school_id = ? AND sa.id IS NULL
       ORDER BY s.id ASC`,
      [activeYear.id, schoolId],
    );

    if (!unassignedStudents.length) {
      console.log(
        `ℹ️ All students in School ID ${schoolId} already have admissions for ${activeYear.name}.`,
      );
      continue;
    }

    // 5. Get starting sequence for unique admission_number
    const [lastAdmission] = await db.query(
      `SELECT admission_number FROM student_admissions WHERE school_id = ? ORDER BY id DESC LIMIT 1`,
      [schoolId],
    );

    let nextNumber = 1;
    if (lastAdmission.length && lastAdmission[0].admission_number) {
      const parts = lastAdmission[0].admission_number.split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    console.log(
      `📌 Found ${unassignedStudents.length} unassigned students for School ID ${schoolId}.`,
    );
    console.log(
      `🏫 Distributing across ${targetSlots.length} class-section combinations (30-50 students per section)...`,
    );

    const batchSize = 1000;
    let admissionBatch = [];
    let totalInserted = 0;
    let studentIndex = 0;

    // Track assigned IDs in memory to avoid duplicate inserts in a single transaction
    const processedStudentIds = new Set();

    await db.query("START TRANSACTION");

    try {
      // Loop through each class-section slot and fill it with 30-50 students
      for (const slot of targetSlots) {
        if (studentIndex >= unassignedStudents.length) break;

        // Target range: random capacity between 30 and 50 students per section
        const targetSectionCapacity =
          Math.floor(Math.random() * (50 - 30 + 1)) + 30;
        let rollCounter = 1;

        for (let count = 0; count < targetSectionCapacity; count++) {
          if (studentIndex >= unassignedStudents.length) break;

          const student = unassignedStudents[studentIndex];
          studentIndex++;

          // Double check memory flag to prevent duplicate admission
          if (processedStudentIds.has(student.student_id)) {
            continue;
          }
          processedStudentIds.add(student.student_id);

          const admissionNumber = `SCH${schoolId}-ADM-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
          nextNumber++;

          const rollNo = String(rollCounter).padStart(2, "0");
          rollCounter++;

          const joiningDate = student.created_at
            ? new Date(student.created_at).toISOString().split("T")[0]
            : `${currentYear}-06-01`;

          admissionBatch.push([
            student.school_id, // school_id from students table
            student.student_id, // student_id
            admissionNumber, // admission_number
            joiningDate, // admission_date
            activeYear.id, // academic_year_id
            activeYear.name, // academic_year
            slot.class_id, // class_id
            slot.class_name, // class_name
            slot.section_name, // section
            rollNo, // roll_no (01, 02, 03... per section)
            joiningDate, // joining_date
            null, // subject_group
            totalInserted % 3 === 0, // transport_required
            totalInserted % 7 === 0, // hostel_required
            "new", // admission_type
            "active", // status
          ]);

          totalInserted++;

          // Execute bulk batch insert
          if (admissionBatch.length === batchSize) {
            await insertBatch(db, admissionBatch);
            console.log(
              `  ✓ Inserted batch of ${batchSize} records (Total: ${totalInserted})...`,
            );
            admissionBatch = [];
          }
        }
      }

      // Flush remaining items
      if (admissionBatch.length > 0) {
        await insertBatch(db, admissionBatch);
        admissionBatch = [];
      }

      await db.query("COMMIT");
      console.log(
        `✅ Completed School ID ${schoolId}: ${totalInserted} student admissions successfully created.`,
      );
    } catch (err) {
      await db.query("ROLLBACK");
      console.error(`❌ Error seeding School ID ${schoolId}:`, err);
    }
  }

  console.log("\n🎉 All student admissions seeded successfully!");
};

// Helper function for bulk insert query
const insertBatch = async (db, batch) => {
  const sql = `
    INSERT INTO student_admissions (
      school_id,
      student_id,
      admission_number,
      admission_date,
      academic_year_id,
      academic_year,
      class_id,
      class_name,
      section,
      roll_no,
      joining_date,
      subject_group,
      transport_required,
      hostel_required,
      admission_type,
      status
    ) VALUES ?`;

  await db.query(sql, [batch]);
};
