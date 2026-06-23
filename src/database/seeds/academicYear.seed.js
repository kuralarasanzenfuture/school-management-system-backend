import { getDB } from "../../config/db.js";

export const seedAcademicYears = async () => {
  const db = getDB();

  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found. Skipping academic year seeding.");
    return;
  }

  const academicYear = {
    name: "2026-2027",
    start_date: "2026-06-01",
    end_date: "2027-05-31",
    is_current: true,
    status: "active",
  };

  for (const school of schools) {
    // Ensure only one current academic year per school
    await db.query(
      `
      UPDATE academic_years
      SET is_current = FALSE
      WHERE school_id = ?
      `,
      [school.id]
    );

    // Insert or update the current academic year
    await db.query(
      `
      INSERT INTO academic_years
      (
        school_id,
        name,
        start_date,
        end_date,
        is_current,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        is_current = VALUES(is_current),
        status = VALUES(status)
      `,
      [
        school.id,
        academicYear.name,
        academicYear.start_date,
        academicYear.end_date,
        academicYear.is_current,
        academicYear.status,
      ]
    );
  }

  console.log("✅ Academic years seeded");
};