import { getDB } from "../../config/db.js";
import bcrypt from "bcrypt";

export const seedUsers = async () => {
  const db = getDB();

  const username = "admin";
  const email = "admin@example.com";
  const phone = "1234567890";
  const password = "admin123";

  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert admin user if it doesn't exist
  await db.query(
    `
      INSERT IGNORE INTO users
      (username, email, phone, password)
      VALUES (?, ?, ?, ?)
    `,
    [username, email, phone, hashedPassword],
  );

  // Get user id
  const [users] = await db.query(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [email],
  );

  if (!users.length) {
    throw new Error("Admin user not found after seeding.");
  }

    const userId = users[0].id;

  //   // Assign Admin role (role_id = 1)
  //   await db.query(
  //     `
  //       INSERT IGNORE INTO user_roles
  //       (user_id, role_id)
  //       VALUES (?, ?)
  //     `,
  //     [userId, 1]
  //   );

  const [roles] = await db.query(
    `SELECT id FROM roles WHERE name = ? LIMIT 1`,
    ["ADMIN"],
  );

  if (!roles.length) {
    throw new Error("Admin role not found.");
  }

  const roleId = roles[0].id;

  await db.query(
    `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
    [userId, roleId],
  );

  console.log("✅ Admin user seeded");
};
