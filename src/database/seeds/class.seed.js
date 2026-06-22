import { getDB } from "../../config/db.js";

export const seedClasses = async () => {
  const db = getDB();

  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found. Skipping classes.");
    return;
  }

  const classes = [
    "Pre-KG",
    "LKG",
    "UKG",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  for (const school of schools) {
    for (const className of classes) {
      await db.query(
        `
        INSERT INTO classes
        (school_id, name, status)
        VALUES (?, ?, 'active')
        ON DUPLICATE KEY UPDATE
        status = VALUES(status)
        `,
        [school.id, className]
      );
    }
  }

  console.log("✅ Classes seeded");
};