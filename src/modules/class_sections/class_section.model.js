import { getDB } from "../../config/db.js";

export const ClassSectionModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO class_sections
      (school_id, class_id, section_id, academic_year_id,
       class_teacher_id, capacity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.class_id,
        data.section_id,
        data.academic_year_id,
        data.class_teacher_id,
        data.capacity,
        data.status,
      ],
    );

    return res.insertId;
  },

  async findDuplicate(conn, data) {
    const [[row]] = await conn.query(
      `
      SELECT id FROM class_sections
      WHERE school_id=?
        AND class_id=?
        AND section_id=?
        AND academic_year_id=?
      `,
      [data.school_id, data.class_id, data.section_id, data.academic_year_id],
    );
    return row;
  },

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(`SELECT * FROM class_sections WHERE id=?`, [
      id,
    ]);

    return row;
  },

  async update(conn, id, fields, values) {
    await conn.query(
      `UPDATE class_sections SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM class_sections WHERE id=?`, [id]);
  },
};
