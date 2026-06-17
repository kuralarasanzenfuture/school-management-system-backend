import { getDB } from "../../config/db.js";

export const UserModel = {
  async create(connection, userData) {
    const { username, email, phone, password, school_id } = userData;

    const [result] = await connection.query(
      `
      INSERT INTO users (username, email, phone, password, school_id)
      VALUES (?, ?, ?, ?, ?)
      `,
      [username, email, phone, password, school_id],
    );

    return result.insertId;
  },

  async findByLoginId(login_id) {
  const db = getDB();

  const [[user]] = await db.query(
    `
    SELECT * FROM users
    WHERE LOWER(username) = ?
       OR LOWER(email) = ?
       OR phone = ?
    LIMIT 1
    `,
    [login_id, login_id, login_id]
  );

  return user;
},

  async getUserRoles(user_id) {
    const db = getDB();
    const [roles] = await db.query(
      ` SELECT r.id, r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? `,
      [user_id],
    );

    return roles;
  },

  async assignRole(connection, user_id, role_id) {
    await connection.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES (?, ?)
      `,
      [user_id, role_id],
    );
  },

  //   async findDuplicate({ email, phone, username }) {
  //     const db = getDB();

  //     const [rows] = await db.query(
  //       `
  //       SELECT id FROM users
  //       WHERE email = ? OR phone = ? OR username = ?
  //       `,
  //       [email, phone, username]
  //     );

  //     return rows.length > 0;
  //   },

  async findDuplicate({ email, phone, username }) {
    const db = getDB();

    const [rows] = await db.query(
      `
    SELECT 
      email,
      phone,
      username
    FROM users
    WHERE email = ? OR phone = ? OR username = ?
    `,
      [email, phone, username],
    );

    if (!rows.length) return null;

    const existing = rows[0];

    if (existing.email === email) {
      return "EMAIL_EXISTS";
    }

    if (existing.phone === phone) {
      return "PHONE_EXISTS";
    }

    if (existing.username === username) {
      return "USERNAME_EXISTS";
    }

    return "USER_EXISTS";
  },
};
