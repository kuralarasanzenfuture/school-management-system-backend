import { getDB } from "../../config/db.js";

export const seedSubjectGroups = async () => {
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

  const subjectGroups = [
    {
      name: "Languages",
      description: "Tamil, English, Hindi, Sanskrit, French and other language subjects.",
    },
    {
      name: "Mathematics",
      description: "Mathematics and Advanced Mathematics.",
    },
    {
      name: "Science",
      description: "General Science for primary and middle school.",
    },
    {
      name: "Physics",
      description: "Physics theory and practical subjects.",
    },
    {
      name: "Chemistry",
      description: "Chemistry theory and laboratory.",
    },
    {
      name: "Biology",
      description: "Biology and Life Science subjects.",
    },
    {
      name: "Computer Science",
      description: "Computer Science and Computer Applications.",
    },
    {
      name: "Social Science",
      description: "History, Geography, Civics and Economics.",
    },
    {
      name: "Commerce",
      description: "Commerce, Accountancy and Business Studies.",
    },
    {
      name: "Arts",
      description: "Drawing, Art & Craft, Music and Dance.",
    },
    {
      name: "Physical Education",
      description: "Sports, Physical Education and Yoga.",
    },
    {
      name: "Life Skills",
      description: "Moral Science, Value Education and General Knowledge.",
    },
  ];

  for (const school of schools) {
    for (const group of subjectGroups) {
      await db.query(
        `
        INSERT INTO subject_groups
        (
          school_id,
          name,
          description,
          status
        )
        VALUES (?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          status = VALUES(status)
        `,
        [
          school.id,
          group.name,
          group.description,
        ]
      );
    }

    console.log(`✅ Subject Groups seeded for School ${school.id}`);
  }

  console.log("✅ Subject Groups seeded successfully");
};