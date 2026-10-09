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
      role_code: "ADMIN",
      description: "Has full access to the entire school management system.",
      is_system: 1,
    },
    {
      name: "PRINCIPAL",
      role_code: "PRINCIPAL",
      description: "Manages school operations, staff, students, and reports.",
      is_system: 1,
    },
    {
      name: "TEACHER",
      role_code: "TEACHER",
      description: "Manages classes, attendance, marks, and student performance.",
      is_system: 1,
    },
    {
      name: "STUDENT",
      role_code: "STUDENT",
      description: "Can access personal profile, attendance, marks, and timetable.",
      is_system: 1,
    },
    {
      name: "ACCOUNTANT",
      role_code: "ACCOUNTANT",
      description: "Manages fees, payments, expenses, and financial reports.",
      is_system: 1,
    },
  ];

  for (const role of roles) {
    await db.query(
      `
      INSERT INTO roles (name, role_code, description, is_system)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        role_code = VALUES(role_code),
        description = VALUES(description),
        is_system = VALUES(is_system)
      `,
      [role.name, role.role_code, role.description, role.is_system]
    );
  }

  console.log("✅ Roles seeded");
};
