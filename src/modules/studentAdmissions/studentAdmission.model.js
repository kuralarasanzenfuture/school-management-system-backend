import { getDB } from "../../config/db.js";

export const StudentAdmissionModel = {

  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO student_admissions SET ?`,
      [data]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();

    const [[row]] = await db.query(
      `SELECT * FROM student_admissions WHERE id=?`,
      [id]
    );

    return row;
  },

  countByYear: async (conn, academic_year_id) => {
    const [[row]] = await conn.query(
      `SELECT COUNT(*) as total FROM student_admissions WHERE academic_year_id=?`,
      [academic_year_id]
    );

    return row.total;
  },

  getAll: async (filters = {}) => {
    const db = getDB();

    let query = `SELECT * FROM student_admissions WHERE 1=1`;
    const values = [];

    if (filters.student_id) {
      query += ` AND student_id=?`;
      values.push(filters.student_id);
    }

    if (filters.class_id) {
      query += ` AND class_id=?`;
      values.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND academic_year_id=?`;
      values.push(filters.academic_year_id);
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await db.query(query, values);
    return rows;
  },

  update: async (conn, id, data) => {
    await conn.query(
      `UPDATE student_admissions SET ? WHERE id=?`,
      [data, id]
    );
  },

  delete: async (conn, id) => {
    await conn.query(
      `DELETE FROM student_admissions WHERE id=?`,
      [id]
    );
  }
};