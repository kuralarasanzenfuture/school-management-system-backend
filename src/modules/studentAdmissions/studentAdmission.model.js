import { getDB } from "../../config/db.js";

export const StudentAdmissionModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(`INSERT INTO student_admissions SET ?`, [
      data,
    ]);
    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();

    const [[row]] = await db.query(
      `SELECT * FROM student_admissions WHERE id=?`,
      [id],
    );

    return row;
  },

  countByYear: async (conn, academic_year_id) => {
    const [[row]] = await conn.query(
      `SELECT COUNT(*) as total FROM student_admissions WHERE academic_year_id=?`,
      [academic_year_id],
    );

    return row.total;
  },

  // getAll: async (filters = {}) => {
  //   const db = getDB();

  //   let query = `SELECT * FROM student_admissions WHERE 1=1`;
  //   const values = [];

  //   if (filters.student_id) {
  //     query += ` AND student_id=?`;
  //     values.push(filters.student_id);
  //   }

  //   if (filters.class_id) {
  //     query += ` AND class_id=?`;
  //     values.push(filters.class_id);
  //   }

  //   if (filters.academic_year_id) {
  //     query += ` AND academic_year_id=?`;
  //     values.push(filters.academic_year_id);
  //   }

  //   query += ` ORDER BY id DESC`;

  //   const [rows] = await db.query(query, values);
  //   return rows;
  // },

  getAll: async (filters = {}) => {
    const db = getDB();

    let query = `
    SELECT
      sa.*,

      -- Student Details
      s.student_code,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.email,
      s.mobile_no,
      s.gender,
      s.date_of_birth,
      s.photo_url,
      s.status AS student_status,

      -- School
      sch.id AS school_id,
      sch.name AS school_name,

      -- Class
      c.name AS class_name,

      -- Academic Year
      ay.name AS academic_year_name

    FROM student_admissions sa

    INNER JOIN students s
      ON sa.student_id = s.id

    LEFT JOIN schools sch
      ON s.school_id = sch.id

    LEFT JOIN classes c
      ON sa.class_id = c.id

    LEFT JOIN academic_years ay
      ON sa.academic_year_id = ay.id

    WHERE 1 = 1
  `;

    const values = [];

    if (filters.student_id) {
      query += ` AND sa.student_id = ?`;
      values.push(filters.student_id);
    }

    if (filters.class_id) {
      query += ` AND sa.class_id = ?`;
      values.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND sa.academic_year_id = ?`;
      values.push(filters.academic_year_id);
    }

    // Filter by school through students table
    if (filters.school_id) {
      query += ` AND s.school_id = ?`;
      values.push(filters.school_id);
    }

    query += ` ORDER BY sa.id DESC`;

    const [rows] = await db.query(query, values);

    return rows;
  },

  update: async (conn, id, data) => {
    await conn.query(`UPDATE student_admissions SET ? WHERE id=?`, [data, id]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM student_admissions WHERE id=?`, [id]);
  },
};
