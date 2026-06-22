import { getDB } from "../../config/db.js";

export const seedDepartments = async () => {
  const db = getDB();

  // Get all schools
  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found. Skipping department seeding.");
    return;
  }

  const departments = [
    {
      name: "Administration",
      description: "School administration and management.",
    },
    {
      name: "Accounts",
      description: "Handles fees, payroll, and financial records.",
    },
    {
      name: "Admissions",
      description: "Student admissions and enrollment.",
    },
    {
      name: "Examination",
      description: "Conducts exams and publishes results.",
    },
    {
      name: "Science",
      description: "Physics, Chemistry, and Biology department.",
    },
    {
      name: "Mathematics",
      description: "Mathematics department.",
    },
    {
      name: "Computer Science",
      description: "Computer Science and Information Technology.",
    },
    {
      name: "English",
      description: "English language and literature.",
    },
    {
      name: "Tamil",
      description: "Tamil language department.",
    },
    {
      name: "Social Science",
      description: "History, Geography, Civics, and Economics.",
    },
    {
      name: "Physical Education",
      description: "Sports and physical education.",
    },
    {
      name: "Library",
      description: "Library management and services.",
    },
    {
      name: "Transport",
      description: "School transport management.",
    },
    {
      name: "Hostel",
      description: "Hostel administration and student welfare.",
    },
  ];

  for (const school of schools) {
    for (const dept of departments) {
      await db.query(
        `
        INSERT IGNORE INTO departments
        (school_id, name, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description)
        `,
        [school.id, dept.name, dept.description]
      );
    }
  }

  console.log("✅ Departments seeded");
};