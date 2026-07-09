import { getDB } from "../../config/db.js";

export const seedClassSections = async () => {
  const db = getDB();

  const [schools] = await db.query(`
    SELECT id
    FROM schools
    ORDER BY id
  `);

  if (!schools.length) {
    console.log("⚠️ No schools found.");
    return;
  }

  for (const school of schools) {
    const schoolId = school.id;

    // Current academic year
    const [years] = await db.query(
      `
      SELECT id
      FROM academic_years
      WHERE school_id = ?
        AND is_current = TRUE
      LIMIT 1
      `,
      [schoolId],
    );

    if (!years.length) {
      console.log(`⚠️ No current academic year for school ${schoolId}`);
      continue;
    }

    const academicYearId = years[0].id;

    // Classes of this school
    const [classes] = await db.query(
      `
      SELECT id
      FROM classes
      WHERE school_id = ?
      ORDER BY id
      `,
      [schoolId],
    );

    for (const cls of classes) {
      // Sections of this class
      const [sections] = await db.query(
        `
        SELECT id, capacity
        FROM sections
        WHERE class_id = ?
        ORDER BY id
        `,
        [cls.id],
      );

      for (const section of sections) {
        await db.query(
          `
          INSERT IGNORE INTO class_sections
          (
            school_id,
            class_id,
            section_id,
            academic_year_id,
            class_teacher_id,
            capacity,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            schoolId,
            cls.id,
            section.id,
            academicYearId,
            null,
            section.capacity ?? 40,
            "active",
          ],
        );
      }
    }

    console.log(`✅ Class Sections seeded for School ${schoolId}`);
  }

  console.log("✅ All class sections seeded");
};
