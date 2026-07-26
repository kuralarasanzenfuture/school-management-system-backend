import { getDB } from "../../config/db.js";

// export const StudentAttendanceModel = {
//   /* ================= SESSION ================= */

//   async findSession(
//     conn,
//     school_id,
//     academic_year_id,
//     class_section_id,
//     attendance_date,
//     period_no,
//   ) {
//     const [[row]] = await conn.query(
//       `SELECT * FROM student_attendance_sessions
//        WHERE school_id=?
//        AND academic_year_id=?
//        AND class_section_id=?
//        AND attendance_date=?
//        AND (period_no <=> ?)`,
//       [
//         school_id,
//         academic_year_id,
//         class_section_id,
//         attendance_date,
//         period_no,
//       ],
//     );
//     return row;
//   },

//   async createSession(conn, data) {
//     const [res] = await conn.query(
//       `INSERT INTO student_attendance_sessions SET ?`,
//       [data],
//     );
//     return res.insertId;
//   },

//   async lockSession(conn, session_id) {
//     await conn.query(
//       `UPDATE student_attendance_sessions SET is_locked=1 WHERE id=?`,
//       [session_id],
//     );
//   },

//   async unlockSession(conn, session_id) {
//     await conn.query(
//       `UPDATE student_attendance_sessions SET is_locked=0 WHERE id=?`,
//       [session_id],
//     );
//   },

//   /* ================= ATTENDANCE ================= */

//   async bulkUpsert(conn, values) {
//     await conn.query(
//       `
//       INSERT INTO student_attendance
//       (attendance_session_id, admission_id, attendance_status, remarks, marked_by)
//       VALUES ?
//       ON DUPLICATE KEY UPDATE
//         attendance_status=VALUES(attendance_status),
//         remarks=VALUES(remarks),
//         marked_by=VALUES(marked_by)
//       `,
//       [values],
//     );
//   },

//   async findBySession(conn, session_id) {
//     const [rows] = await conn.query(
//       `SELECT * FROM student_attendance WHERE attendance_session_id=?`,
//       [session_id],
//     );
//     return rows;
//   },

//   async findById(conn, id) {
//     const [[row]] = await conn.query(
//       `SELECT * FROM student_attendance WHERE id=?`,
//       [id],
//     );
//     return row;
//   },

//   async update(conn, id, data) {
//     await conn.query(`UPDATE student_attendance SET ? WHERE id=?`, [data, id]);
//   },

//   async delete(conn, id) {
//     await conn.query(`DELETE FROM student_attendance WHERE id=?`, [id]);
//   },
// };

export const StudentAttendanceModel = {
  /* ================= SESSION ================= */

  async findSession(
    conn,
    school_id,
    academic_year_id,
    class_section_id,
    attendance_date,
    attendance_type,
    period_no,
  ) {
    const [[row]] = await conn.query(
      `
      SELECT * FROM student_attendance_sessions
      WHERE school_id = ?
      AND academic_year_id = ?
      AND class_section_id = ?
      AND attendance_date = ?
      AND attendance_type = ?
      AND (period_no <=> ?)
      `,
      [
        school_id,
        academic_year_id,
        class_section_id,
        attendance_date,
        attendance_type,
        period_no,
      ],
    );

    return row;
  },

  async createSession(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO student_attendance_sessions SET ?`,
      [data],
    );
    return res.insertId;
  },

  async lockSession(conn, session_id) {
    await conn.query(
      `UPDATE student_attendance_sessions SET is_locked=1 WHERE id=?`,
      [session_id],
    );
  },

  async unlockSession(conn, session_id) {
    await conn.query(
      `UPDATE student_attendance_sessions SET is_locked=0 WHERE id=?`,
      [session_id],
    );
  },

  /* ================= ATTENDANCE ================= */

  async bulkUpsert(conn, values) {
    if (!values.length) return;

    await conn.query(
      `
      INSERT INTO student_attendance
      (attendance_session_id, admission_id, attendance_status, remarks, marked_by)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        attendance_status = VALUES(attendance_status),
        remarks = VALUES(remarks),
        marked_by = VALUES(marked_by)
      `,
      [values],
    );
  },

  async findBySession(conn, session_id) {
    const [rows] = await conn.query(
      `SELECT * FROM student_attendance WHERE attendance_session_id=?`,
      [session_id],
    );
    return rows;
  },

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM student_attendance WHERE id=?`,
      [id],
    );
    return row;
  },

  async update(conn, id, data) {
    await conn.query(`UPDATE student_attendance SET ? WHERE id=?`, [data, id]);
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM student_attendance WHERE id=?`, [id]);
  },
};
