import { getDB } from "../../config/db.js";

export const RoleModel = {
  async create(name, description) {
    const db = getDB();

    const [result] = await db.query(
      `INSERT INTO roles (name, description) VALUES (?, ?)`,
      [name, description],
    );

    return result.insertId;
  },

  async findAll() {
    const db = getDB();
    const [rows] = await db.query(`SELECT * FROM roles ORDER BY id ASC`);
    return rows;
  },

  async findById(id) {
    const db = getDB();

    const [[role]] = await db.query(`SELECT * FROM roles WHERE id = ?`, [id]);

    return role;
  },

  async findByName(name) {
    const db = getDB();

    const [[role]] = await db.query(`SELECT * FROM roles WHERE name = ?`, [
      name,
    ]);

    return role;
  },

  async update(id, name, description, status) {
    const db = getDB();

    await db.query(
      `UPDATE roles SET name=?, description=?, status=? WHERE id=?`,
      [name, description, status, id],
    );
  },

  async delete(id) {
    const db = getDB();
    await db.query(`DELETE FROM roles WHERE id=?`, [id]);
  },

  async countAssignedUsers(role_id) {
    const db = getDB();
    // const [[row]] = await db.query(
    //   `SELECT COUNT(*) as count FROM users WHERE role_id=?`,
    //   [role_id],
    // );

    //   const [[row]] = await db.query(
    //   `
    //   SELECT COUNT(*) as count
    //   FROM user_roles
    //   WHERE role_id = ?
    //   `,
    //   [role_id]
    // );

    // const [[row]] = await db.query(
    //   `
    // SELECT COUNT(DISTINCT user_id) as count
    // FROM user_roles
    // WHERE role_id = ?
    // `,
    //   [role_id],
    // );

    const [[row]] = await db.query(
      `
    SELECT COUNT(DISTINCT u.id) as count
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_id = ?
    AND u.status = 'active'
    `,
      [role_id],
    );

    return row.count;
  },

  async getAdminRoleId() {
    const db = getDB();

    const [[role]] = await db.query(
      `SELECT id FROM roles WHERE name = 'ADMIN'`,
    );

    return role?.id;
  },

  async isAdminAlreadyAssigned() {
    const db = getDB();

    const [[row]] = await db.query(
      `
    SELECT COUNT(*) as count
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'ADMIN'
    `,
    );

    return row.count > 0;
  },
};
