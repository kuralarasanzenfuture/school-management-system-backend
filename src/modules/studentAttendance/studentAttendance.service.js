import { getDB } from "../../config/db.js";
import { validateAttendance } from "./studentAttendance.validation.js";
import { StudentAttendanceModel as Model } from "./studentAttendance.model.js";

export const markAttendance = async (user, body) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const data = validateAttendance(body);

    await conn.beginTransaction();

    /* 🔴 1. Employee check */
    const [[employee]] = await conn.query(
      `SELECT id, school_id FROM employees WHERE user_id=?`,
      [user.id],
    );

    if (!employee) throw { status: 403, message: "Employee required" };

    /* 🔴 2. Class section check */
    const [[classInfo]] = await conn.query(
      `SELECT school_id, academic_year_id 
       FROM class_sections WHERE id=?`,
      [data.class_section_id],
    );

    if (!classInfo) throw { status: 404, message: "Class section not found" };

    /* 🔴 3. Admission validation (VERY IMPORTANT) */
    const [validAdmissions] = await conn.query(
      `
      SELECT id FROM student_admissions
      WHERE id IN (?)
      AND class_id IN (
        SELECT class_id FROM class_sections WHERE id=?
      )
      `,
      [data.students.map((s) => s.admission_id), data.class_section_id],
    );

    const validIds = validAdmissions.map((r) => r.id);

    data.students.forEach((s) => {
      if (!validIds.includes(s.admission_id)) {
        throw {
          status: 400,
          message: `Invalid admission_id ${s.admission_id}`,
        };
      }
    });

    /* 🔴 4. Session */
    let session = await Model.findSession(
      conn,
      classInfo.school_id,
      classInfo.academic_year_id,
      data.class_section_id,
      data.attendance_date,
      data.period_no,
    );

    let sessionId;

    if (!session) {
      sessionId = await Model.createSession(conn, {
        school_id: classInfo.school_id,
        academic_year_id: classInfo.academic_year_id,
        class_section_id: data.class_section_id,
        attendance_date: data.attendance_date,
        attendance_type: data.attendance_type,
        period_no: data.period_no,
        remarks: data.remarks,
        taken_by: employee.id,
      });
    } else {
      if (session.is_locked) {
        throw { status: 400, message: "Session locked" };
      }
      sessionId = session.id;
    }

    /* 🔥 5. BULK UPSERT (FIXED) */
    const values = data.students.map((s) => [
      sessionId,
      s.admission_id,
      s.status,
      s.remarks,
      employee.id,
    ]);

    await Model.bulkUpsert(conn, values);

    await conn.commit();

    return {
      message: "Attendance saved",
      attendance_session_id: sessionId,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAttendance = async (filters = {}) => {
  const db = getDB();

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,

      sas.id AS session_id,
      sas.attendance_date,
      sas.attendance_type,
      sas.period_no,
      sas.is_locked,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      adm.id AS admission_id,
      adm.roll_no,

      emp.id AS marked_by_id,
      emp.first_name AS marked_by_name,

      sc.id AS school_id,
      sc.name AS school_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON adm.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN schools sc 
      ON sas.school_id = sc.id

    JOIN employees emp 
      ON sa.marked_by = emp.id

    WHERE 1=1
  `;

  const values = [];

  // 🔍 FILTERS
  if (filters.date) {
    query += ` AND sas.attendance_date = ?`;
    values.push(filters.date);
  }

  if (filters.class_section_id) {
    query += ` AND sas.class_section_id = ?`;
    values.push(filters.class_section_id);
  }

  if (filters.student_id) {
    query += ` AND st.id = ?`;
    values.push(filters.student_id);
  }

  if (filters.school_id) {
    query += ` AND sas.school_id = ?`;
    values.push(filters.school_id);
  }

  query += ` ORDER BY sas.attendance_date DESC, sa.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getAllAttendanceByToken = async (user, filters = {}) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  const isAdmin =
    user.role === "ADMIN" ||
    user.roles?.includes("ADMIN") ||
    user.roles?.some((r) => r.name === "ADMIN");

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,

      sas.id AS session_id,
      sas.attendance_date,
      sas.period_no,
      sas.attendance_type,
      sas.is_locked,

      sc.id AS school_id,
      sc.name AS school_name,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      adm.roll_no,

      emp.id AS marked_by_id,
      emp.first_name AS marked_by_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN schools sc 
      ON sas.school_id = sc.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON adm.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN employees emp 
      ON sa.marked_by = emp.id

    WHERE 1=1
  `;

  const values = [];

  // 🔐 SCHOOL FILTER (CRITICAL)
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned to user" };
    }

    query += ` AND sas.school_id = ?`;
    values.push(user.school_id);
  }

  // 🔍 FILTERS

  if (filters.date) {
    query += ` AND sas.attendance_date = ?`;
    values.push(filters.date);
  }

  if (filters.from_date) {
    query += ` AND sas.attendance_date >= ?`;
    values.push(filters.from_date);
  }

  if (filters.to_date) {
    query += ` AND sas.attendance_date <= ?`;
    values.push(filters.to_date);
  }

  if (filters.class_section_id) {
    query += ` AND sas.class_section_id = ?`;
    values.push(filters.class_section_id);
  }

  if (filters.student_id) {
    query += ` AND st.id = ?`;
    values.push(filters.student_id);
  }

  if (filters.status) {
    query += ` AND sa.attendance_status = ?`;
    values.push(filters.status);
  }

  // 🔥 SORTING
  query += ` ORDER BY sas.attendance_date DESC, adm.roll_no ASC`;

  // ⚡ PAGINATION (VERY IMPORTANT FOR REAL SYSTEM)
  if (filters.limit) {
    const limit = Number(filters.limit) || 50;
    const offset = Number(filters.offset) || 0;

    query += ` LIMIT ? OFFSET ?`;
    values.push(limit, offset);
  }

  const [rows] = await db.query(query, values);

  return rows;
};

export const getAttendanceBySession = async (session_id, user) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "session_id required" };
  }

  // 🔍 Validate session + security
  const [[session]] = await db.query(
    `SELECT id, school_id, attendance_date, class_section_id, is_locked
     FROM student_attendance_sessions
     WHERE id=?`,
    [session_id],
  );

  if (!session) {
    throw { status: 404, message: "Session not found" };
  }

  // 🔐 School restriction
  if (user?.school_id && session.school_id !== user.school_id) {
    throw { status: 403, message: "Unauthorized access" };
  }

  // 📊 Full detailed data
  const [rows] = await db.query(
    `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,

      adm.id AS admission_id,
      adm.roll_no,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      emp.first_name AS marked_by_name

    FROM student_attendance sa

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON adm.student_id = st.id

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN employees emp 
      ON sa.marked_by = emp.id

    WHERE sa.attendance_session_id = ?

    ORDER BY adm.roll_no ASC
    `,
    [session_id],
  );

  return {
    session,
    students: rows,
  };
};

export const getAttendanceById = async (id) => {
  const db = getDB();

  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const [[row]] = await db.query(
    `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,

      sas.id AS session_id,
      sas.attendance_date,
      sas.period_no,
      sas.is_locked,

      adm.id AS admission_id,
      adm.roll_no,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      emp.id AS marked_by_id,
      emp.first_name AS marked_by_name,

      sc.id AS school_id,
      sc.name AS school_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON adm.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN schools sc 
      ON sas.school_id = sc.id

    JOIN employees emp 
      ON sa.marked_by = emp.id

    WHERE sa.id = ?
    `,
    [id],
  );

  if (!row) {
    throw { status: 404, message: "Attendance not found" };
  }

  return row;
};

export const getAttendanceByStudent = async (admission_id, filters = {}) => {
  const db = getDB();

  if (!admission_id) {
    throw { status: 400, message: "admission_id required" };
  }

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,

      sas.attendance_date,
      sas.period_no,
      sas.attendance_type,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      emp.first_name AS marked_by_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN employees emp 
      ON sa.marked_by = emp.id

    WHERE sa.admission_id = ?
  `;

  const values = [admission_id];

  // 🔍 filters
  if (filters.from_date) {
    query += ` AND sas.attendance_date >= ?`;
    values.push(filters.from_date);
  }

  if (filters.to_date) {
    query += ` AND sas.attendance_date <= ?`;
    values.push(filters.to_date);
  }

  query += ` ORDER BY sas.attendance_date DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getAttendanceByDate = async (filters = {}) => {
  const db = getDB();

  if (!filters.date) {
    throw { status: 400, message: "date required" };
  }

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,

      sas.attendance_date,
      sas.period_no,
      sas.attendance_type,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      adm.roll_no,

      emp.first_name AS marked_by_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON adm.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN employees emp 
      ON sa.marked_by = emp.id

    WHERE sas.attendance_date = ?
  `;

  const values = [filters.date];

  if (filters.class_section_id) {
    query += ` AND sas.class_section_id = ?`;
    values.push(filters.class_section_id);
  }

  query += ` ORDER BY c.name, s.name, adm.roll_no`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const updateAttendance = async (id, data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await Model.findById(conn, id);
    if (!existing) throw { status: 404, message: "Attendance not found" };

    const [[session]] = await conn.query(
      `SELECT is_locked FROM student_attendance_sessions WHERE id=?`,
      [existing.attendance_session_id],
    );

    if (session.is_locked) {
      throw { status: 400, message: "Session locked" };
    }

    await Model.update(conn, id, {
      attendance_status: data.status,
      remarks: data.remarks || null,
    });

    await conn.commit();

    return { message: "Updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteAttendance = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await Model.findById(conn, id);
    if (!existing) throw { status: 404, message: "Not found" };

    await Model.delete(conn, id);

    await conn.commit();

    return { message: "Deleted successfully " };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const lockAttendanceSession = async (session_id, user) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "session_id required" };
  }

  // 🔍 Check session exists
  const [[session]] = await db.query(
    `SELECT id, is_locked, school_id 
     FROM student_attendance_sessions 
     WHERE id=?`,
    [session_id],
  );

  if (!session) {
    throw { status: 404, message: "Session not found" };
  }

  // 🔐 School-level security
  if (user.school_id && session.school_id !== user.school_id) {
    throw { status: 403, message: "Unauthorized access" };
  }

  // ⚠️ Already locked
  if (session.is_locked) {
    throw { status: 400, message: "Session already locked" };
  }

  // 🔒 Lock it
  await db.query(
    `UPDATE student_attendance_sessions SET is_locked=1 WHERE id=?`,
    [session_id],
  );

  return { message: "Session locked successfully" };
};

export const unlockAttendanceSession = async (session_id, user) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "session_id required" };
  }

  const [[session]] = await db.query(
    `SELECT id, is_locked, school_id 
     FROM student_attendance_sessions 
     WHERE id=?`,
    [session_id],
  );

  if (!session) {
    throw { status: 404, message: "Session not found" };
  }

  if (user.school_id && session.school_id !== user.school_id) {
    throw { status: 403, message: "Unauthorized access" };
  }

  // ⚠️ Already unlocked
  if (!session.is_locked) {
    throw { status: 400, message: "Session already unlocked" };
  }

  await db.query(
    `UPDATE student_attendance_sessions SET is_locked=0 WHERE id=?`,
    [session_id],
  );

  return { message: "Session unlocked successfully" };
};
