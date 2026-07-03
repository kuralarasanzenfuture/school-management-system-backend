// import { getDB } from "../../config/db.js";
// import bcrypt from "bcrypt";

// export const seedUsers = async () => {
//   const db = getDB();

//   const username = "admin";
//   const email = "admin@example.com";
//   const phone = "1234567890";
//   const password = "admin123";

//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Insert admin user if it doesn't exist
//   await db.query(
//     `
//       INSERT IGNORE INTO users
//       (username, email, phone, password)
//       VALUES (?, ?, ?, ?)
//     `,
//     [username, email, phone, hashedPassword],
//   );

//   // Get user id
//   const [users] = await db.query(
//     `SELECT id FROM users WHERE email = ? LIMIT 1`,
//     [email],
//   );

//   if (!users.length) {
//     throw new Error("Admin user not found after seeding.");
//   }

//     const userId = users[0].id;

//   //   // Assign Admin role (role_id = 1)
//   //   await db.query(
//   //     `
//   //       INSERT IGNORE INTO user_roles
//   //       (user_id, role_id)
//   //       VALUES (?, ?)
//   //     `,
//   //     [userId, 1]
//   //   );

//   const [roles] = await db.query(
//     `SELECT id FROM roles WHERE name = ? LIMIT 1`,
//     ["ADMIN"],
//   );

//   if (!roles.length) {
//     throw new Error("Admin role not found.");
//   }

//   const roleId = roles[0].id;

//   await db.query(
//     `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
//     [userId, roleId],
//   );

//   console.log("✅ Admin user seeded");
// };

import { getDB } from "../../config/db.js";
import bcrypt from "bcrypt";

export const seedUsers = async () => {
  const db = getDB();

  const hashedPassword = await bcrypt.hash("123456", 10);

  const [schools] = await db.query(`
  SELECT id, name
  FROM schools
  ORDER BY id
`);

  const schoolId = schools.length ? schools[0].id : null;

  // System Admin (no school)
  const users = [
    {
      username: "admin",
      email: "admin@example.com",
      phone: "9999999999",
      school_id: null,
      role: "ADMIN",
      password: hashedPassword,
    },
  ];

  let count = 1;

  for (const school of schools) {
    users.push(
      {
        username: `kural${count}`,
        email: `kural${count}@example.com`,
        phone: `90000000${String(count).padStart(2, "0")}`,
        school_id: school.id,
        role: "PRINCIPAL",
        password: hashedPassword,
      },
      {
        username: `teacher${count}`,
        email: `teacher${count}@example.com`,
        phone: `91000000${String(count).padStart(2, "0")}`,
        school_id: school.id,
        role: "TEACHER",
        password: hashedPassword,
      },
      {
        username: `account${count}`,
        email: `account${count}@example.com`,
        phone: `92000000${String(count).padStart(2, "0")}`,
        school_id: school.id,
        role: "ACCOUNTANT",
        password: hashedPassword,
      },
    );

    count++;
  }

  console.log("School ID:", schoolId);

  for (const user of users) {
    await db.query(
      `
  INSERT INTO users
  (
    school_id,
    username,
    email,
    phone,
    password
  )
  VALUES (?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    school_id = VALUES(school_id),
    username = VALUES(username),
    phone = VALUES(phone),
    password = VALUES(password),
    status = 'active'
  `,
      [user.school_id, user.username, user.email, user.phone, user.password],
    );

    const [savedUsers] = await db.query(
      `SELECT id FROM users WHERE username = ? LIMIT 1`,
      [user.username],
    );

    const [roles] = await db.query(
      `SELECT id FROM roles WHERE name = ? LIMIT 1`,
      [user.role],
    );

    if (!savedUsers.length || !roles.length) continue;

    await db.query(
      `
      INSERT IGNORE INTO user_roles
      (
        user_id,
        role_id
      )
      VALUES (?, ?)
      `,
      [savedUsers[0].id, roles[0].id],
    );
  }

  console.log("✅ Users seeded");
};
