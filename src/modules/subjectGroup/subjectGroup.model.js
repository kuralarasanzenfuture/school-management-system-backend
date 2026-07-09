import { getDB } from "../../config/db.js";

export const SubjectGroupModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO subject_groups
      (school_id, name, description, status)
      VALUES (?, ?, ?, ?)
      `,
      [data.school_id, data.name, data.description, data.status],
    );

    return res.insertId;
  },

  async findById(id) {
    const db = getDB();
    const [[row]] = await db.query(`SELECT * FROM subject_groups WHERE id=?`, [
      id,
    ]);
    return row;
  },

  async findDuplicate(conn, school_id, name, id = null) {
    const [[row]] = await conn.query(
      `
      SELECT id FROM subject_groups
      WHERE school_id=? AND name=?
      ${id ? "AND id!=?" : ""}
      `,
      id ? [school_id, name, id] : [school_id, name],
    );

    return row;
  },

  async update(conn, id, fields, values) {
    await conn.query(
      `UPDATE subject_groups SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM subject_groups WHERE id=?`, [id]);
  },
};
