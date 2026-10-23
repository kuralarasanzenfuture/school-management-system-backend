import { getDB } from "../../config/db.js";

/**
 * Student Admissions & Section Allocations Seeder
 * Aligned with 014_student_admissions.sql and 014_student_section_allocations.sql schemas:
 *  - student_admissions: school_id, student_id, admission_number, admission_date,
 *    academic_year_id, class_id, joining_date, subject_group_id, subject_group,
 *    transport_required, hostel_required, admission_type, status.
 *  - student_section_allocations: admission_id, class_section_id, roll_no,
 *    allocation_date, effective_to, status, remarks.
 */
export const seedStudentAdmissions = async () => {
  const db = getDB();
  const currentYear = new Date().getFullYear();

  console.log("\n🚀 Starting Student Admissions & Section Allocations Seeder...");

  // 1. Fetch all schools
  const [schools] = await db.query("SELECT id, name FROM schools ORDER BY id ASC");

  if (!schools.length) {
    console.log("⚠️ No schools found. Please seed schools first.");
    return;
  }

  for (const school of schools) {
    const schoolId = school.id;
    const schoolName = school.name || `School #${schoolId}`;

    console.log(`\n============================================================`);
    console.log(`⏳ Processing School ID: ${schoolId} (${schoolName})`);
    console.log(`============================================================`);

    // 2. Fetch the active academic year for this school
    const [academicYears] = await db.query(
      `SELECT id, name
       FROM academic_years
       WHERE school_id = ? AND status = 'active'
       ORDER BY start_date DESC
       LIMIT 1`,
      [schoolId],
    );

    if (!academicYears.length) {
      console.log(`⚠️ No active academic year found for School ID ${schoolId}. Skipping...`);
      continue;
    }

    const activeYear = academicYears[0];
    const cleanYearName = activeYear.name
      ? String(activeYear.name).replace(/[^a-zA-Z0-9]/g, "")
      : String(currentYear);

    // 3. Fetch structured class_sections mapping for this school and active academic year
    let [classSections] = await db.query(
      `SELECT 
         cs.id AS class_section_id,
         cs.class_id,
         c.name AS class_name,
         cs.section_id,
         s.name AS section_name,
         cs.capacity
       FROM class_sections cs
       JOIN classes c ON cs.class_id = c.id
       JOIN sections s ON cs.section_id = s.id
       WHERE cs.school_id = ? AND cs.academic_year_id = ? AND cs.status = 'active' AND c.status = 'active'
       ORDER BY c.id ASC, s.id ASC`,
      [schoolId, activeYear.id],
    );

    // Fallback: If class_sections is empty, check if classes exist and create basic class_sections mappings
    if (!classSections.length) {
      const [classes] = await db.query(
        `SELECT id, name FROM classes WHERE school_id = ? AND status = 'active' ORDER BY id ASC`,
        [schoolId],
      );

      const [sections] = await db.query(
        `SELECT id, name FROM sections WHERE school_id = ? AND status = 'active' ORDER BY id ASC`,
        [schoolId],
      );

      if (classes.length && sections.length) {
        console.log(`ℹ️ Auto-generating class_sections for School ID ${schoolId}...`);
        for (const cls of classes) {
          for (const sec of sections) {
            await db.query(
              `INSERT IGNORE INTO class_sections (school_id, class_id, section_id, academic_year_id, status)
               VALUES (?, ?, ?, ?, 'active')`,
              [schoolId, cls.id, sec.id, activeYear.id],
            );
          }
        }

        // Re-query class_sections
        const [reloaded] = await db.query(
          `SELECT 
             cs.id AS class_section_id,
             cs.class_id,
             c.name AS class_name,
             cs.section_id,
             s.name AS section_name,
             cs.capacity
           FROM class_sections cs
           JOIN classes c ON cs.class_id = c.id
           JOIN sections s ON cs.section_id = s.id
           WHERE cs.school_id = ? AND cs.academic_year_id = ? AND cs.status = 'active'
           ORDER BY c.id ASC, s.id ASC`,
          [schoolId, activeYear.id],
        );
        classSections = reloaded;
      }
    }

    if (!classSections.length) {
      console.log(`⚠️ No active class sections found for School ID ${schoolId}. Skipping...`);
      continue;
    }

    // 4. Fetch available subject groups for this school
    const [subjectGroups] = await db.query(
      `SELECT id, name FROM subject_groups WHERE school_id = ? AND status = 'active' ORDER BY id ASC`,
      [schoolId],
    );

    // 5. Fetch students belonging to this school who are not yet admitted in this academic year
    const [unassignedStudents] = await db.query(
      `SELECT s.id AS student_id, s.school_id, s.first_name, s.last_name, s.created_at
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

    // 6. Get starting sequence for admission_number in this school
    const [lastAdmission] = await db.query(
      `SELECT admission_number FROM student_admissions WHERE school_id = ? ORDER BY id DESC LIMIT 1`,
      [schoolId],
    );

    let nextNumber = 1;
    if (lastAdmission.length && lastAdmission[0].admission_number) {
      const parts = String(lastAdmission[0].admission_number).split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    console.log(
      `📌 Found ${unassignedStudents.length} unassigned students for School ID ${schoolId}.`,
    );
    console.log(
      `🏫 Distributing across ${classSections.length} class-sections...`,
    );

    // Track roll number counter per class_section_id
    const rollCounters = {};
    for (const cs of classSections) {
      rollCounters[cs.class_section_id] = 1;
    }

    let totalAdmissions = 0;
    let totalAllocations = 0;

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      let slotIndex = 0;

      for (let i = 0; i < unassignedStudents.length; i++) {
        const student = unassignedStudents[i];
        const slot = classSections[slotIndex % classSections.length];
        slotIndex++;

        // Generate sequential admission number
        const admissionNumber = `ADM-${cleanYearName}-${String(nextNumber).padStart(4, "0")}`;
        nextNumber++;

        // Roll number for this section
        const rollNo = String(rollCounters[slot.class_section_id]++).padStart(2, "0");

        const joiningDate = student.created_at
          ? new Date(student.created_at).toISOString().split("T")[0]
          : `${currentYear}-06-01`;

        // Pick a subject group if available
        let subjectGroupId = null;
        let subjectGroupName = null;
        if (subjectGroups.length > 0) {
          const sg = subjectGroups[i % subjectGroups.length];
          subjectGroupId = sg.id;
          subjectGroupName = sg.name;
        }

        // 1. Insert into student_admissions
        const [admResult] = await conn.query(
          `INSERT INTO student_admissions (
             school_id,
             student_id,
             admission_number,
             admission_date,
             academic_year_id,
             class_id,
             joining_date,
             subject_group_id,
             subject_group,
             transport_required,
             hostel_required,
             admission_type,
             status,
             created_by,
             updated_by
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, NULL)`,
          [
            schoolId,
            student.student_id,
            admissionNumber,
            joiningDate,
            activeYear.id,
            slot.class_id,
            joiningDate,
            subjectGroupId,
            subjectGroupName,
            i % 3 === 0 ? 1 : 0, // transport_required (1 in 3)
            i % 7 === 0 ? 1 : 0, // hostel_required (1 in 7)
            "new",
          ],
        );

        const admissionId = admResult.insertId;
        totalAdmissions++;

        // 2. Insert corresponding active record into student_section_allocations
        await conn.query(
          `INSERT INTO student_section_allocations (
             admission_id,
             class_section_id,
             roll_no,
             allocation_date,
             effective_to,
             status,
             remarks,
             created_by,
             updated_by
           ) VALUES (?, ?, ?, ?, NULL, 'active', 'Initial section allocation via seed', NULL, NULL)`,
          [
            admissionId,
            slot.class_section_id,
            rollNo,
            joiningDate,
          ],
        );

        totalAllocations++;

        if (totalAdmissions % 100 === 0 || i === unassignedStudents.length - 1) {
          console.log(
            `  ✓ Seeded ${totalAdmissions}/${unassignedStudents.length} student admissions & section allocations...`,
          );
        }
      }

      await conn.commit();
      console.log(
        `✅ Successfully seeded School ID ${schoolId}: ${totalAdmissions} admissions & ${totalAllocations} section allocations created.`,
      );
    } catch (err) {
      await conn.rollback();
      console.error(`❌ Error seeding admissions for School ID ${schoolId}:`, err);
    } finally {
      conn.release();
    }
  }

  console.log("\n🎉 All student admissions & section allocations seeded successfully!");
};
