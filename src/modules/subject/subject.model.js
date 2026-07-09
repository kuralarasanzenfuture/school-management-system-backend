import { getDB } from "../../config/db.js";

export const SubjectModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO subjects 
      (school_id, name, code, subject_type, status)
      VALUES (?, ?, ?, ?, ?)
      `,
      [data.school_id, data.name, data.code, data.subject_type, data.status],
    );

    return res.insertId;
  },

  async findById(id) {
    const db = getDB();
    const [[row]] = await db.query(`SELECT * FROM subjects WHERE id=?`, [id]);
    return row;
  },

  async findDuplicate(conn, school_id, name, code, id = null) {
    const [[row]] = await conn.query(
      `
      SELECT id FROM subjects
      WHERE school_id=?
      AND (name=? OR (code IS NOT NULL AND code=?))
      ${id ? "AND id!=?" : ""}
      `,
      id ? [school_id, name, code, id] : [school_id, name, code],
    );

    return row;
  },

  async update(conn, id, fields, values) {
    await conn.query(`UPDATE subjects SET ${fields.join(", ")} WHERE id=?`, [
      ...values,
      id,
    ]);
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM subjects WHERE id=?`, [id]);
  },
};
