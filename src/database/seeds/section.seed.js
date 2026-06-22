import { getDB } from "../../config/db.js";

export const seedSections = async () => {
  const db = getDB();

  const [classes] = await db.query(`
      SELECT id
      FROM classes
  `);

  if (!classes.length) {
    console.log("⚠️ No classes found. Skipping sections.");
    return;
  }

  const sections = [
    { name: "A", capacity: 40 },
    { name: "B", capacity: 40 },
    { name: "C", capacity: 40 },
  ];

  for (const cls of classes) {
    for (const section of sections) {
      await db.query(
        `
        INSERT INTO sections
        (class_id, name, capacity, status)
        VALUES (?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
            capacity = VALUES(capacity),
            status = VALUES(status)
        `,
        [cls.id, section.name, section.capacity]
      );
    }
  }

  console.log("✅ Sections seeded");
};