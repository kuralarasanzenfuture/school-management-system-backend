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
    status: "active",
  };

  for (const school of schools) {
    // Optional: If you want to ensure only one active academic year per school,
    // you can update existing active years to 'inactive' first:
    /*
    if (academicYear.status === 'active') {
      await db.query(
        `UPDATE academic_years SET status = 'inactive' WHERE school_id = ? AND status = 'active'`,
        [school.id]
      );
    }
    */

    // Insert or update the academic year (Fixed placeholder count to match 5 columns)
    await db.query(
      `
      INSERT INTO academic_years
      (
        school_id,
        name,
        start_date,
        end_date,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        status = VALUES(status)
      `,
      [
        school.id,
        academicYear.name,
        academicYear.start_date,
        academicYear.end_date,
        academicYear.status,
      ],
    );
  }

  console.log("✅ Academic years seeded");
};
