// import { getDB } from "../../config/db.js";

// export const seedRoles = async () => {
//   const db = getDB(); // 🔥 this is required
//   const roles = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "ACCOUNTANT"];

//   for (const role of roles) {
//     await db.query(`INSERT IGNORE INTO roles (name) VALUES (?)`, [role]);
//   }

//   console.log("✅ Roles seeded");
// };

import { getDB } from "../../config/db.js";

export const seedRoles = async () => {
  const db = getDB();

  const roles = [
    {
      name: "ADMIN",
      description: "Has full access to the entire school management system.",
    },
    {
      name: "PRINCIPAL",
      description: "Manages school operations, staff, students, and reports.",
    },
    {
      name: "TEACHER",
      description: "Manages classes, attendance, marks, and student performance.",
    },
    {
      name: "STUDENT",
      description: "Can access personal profile, attendance, marks, and timetable.",
    },
    {
      name: "ACCOUNTANT",
      description: "Manages fees, payments, expenses, and financial reports.",
    },
  ];

  for (const role of roles) {
    await db.query(
      `
      INSERT IGNORE INTO roles (name, description)
      VALUES (?, ?)
      `,
      [role.name, role.description]
    );
  }

  console.log("✅ Roles seeded");
};
