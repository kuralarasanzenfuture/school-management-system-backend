import { getDB } from "../../config/db.js";

export const seedSubjects = async () => {
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

  const subjects = [
    {
      name: "Tamil",
      code: "TAM",
      type: "theory",
    },
    {
      name: "English",
      code: "ENG",
      type: "theory",
    },
    {
      name: "Mathematics",
      code: "MAT",
      type: "theory",
    },
    {
      name: "Science",
      code: "SCI",
      type: "both",
    },
    {
      name: "Physics",
      code: "PHY",
      type: "both",
    },
    {
      name: "Chemistry",
      code: "CHE",
      type: "both",
    },
    {
      name: "Biology",
      code: "BIO",
      type: "both",
    },
    {
      name: "Computer Science",
      code: "CSC",
      type: "practical",
    },
    {
      name: "Social Science",
      code: "SOC",
      type: "theory",
    },
    {
      name: "History",
      code: "HIS",
      type: "theory",
    },
    {
      name: "Geography",
      code: "GEO",
      type: "theory",
    },
    {
      name: "Economics",
      code: "ECO",
      type: "theory",
    },
    {
      name: "Commerce",
      code: "COM",
      type: "theory",
    },
    {
      name: "Accountancy",
      code: "ACC",
      type: "theory",
    },
    {
      name: "Business Mathematics",
      code: "BM",
      type: "theory",
    },
    {
      name: "Business Studies",
      code: "BST",
      type: "theory",
    },
    {
      name: "Computer Applications",
      code: "CA",
      type: "both",
    },
    {
      name: "General Knowledge",
      code: "GK",
      type: "theory",
    },
    {
      name: "Moral Science",
      code: "MS",
      type: "theory",
    },
    {
      name: "Environmental Science",
      code: "EVS",
      type: "theory",
    },
    {
      name: "Physical Education",
      code: "PE",
      type: "practical",
    },
    {
      name: "Yoga",
      code: "YOG",
      type: "practical",
    },
    {
      name: "Art & Craft",
      code: "ART",
      type: "practical",
    },
    {
      name: "Music",
      code: "MUS",
      type: "practical",
    },
    {
      name: "Dance",
      code: "DAN",
      type: "practical",
    },
    {
      name: "Hindi",
      code: "HIN",
      type: "theory",
    },
    {
      name: "French",
      code: "FRE",
      type: "theory",
    },
    {
      name: "Sanskrit",
      code: "SAN",
      type: "theory",
    },
  ];

  for (const school of schools) {
    for (const subject of subjects) {
      await db.query(
        `
        INSERT INTO subjects
        (
          school_id,
          name,
          code,
          subject_type,
          status
        )
        VALUES (?, ?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
          subject_type = VALUES(subject_type),
          status = VALUES(status)
        `,
        [school.id, subject.name, subject.code, subject.type],
      );
    }

    console.log(`✅ Subjects seeded for School ${school.id}`);
  }

  console.log("✅ All subjects seeded");
};
