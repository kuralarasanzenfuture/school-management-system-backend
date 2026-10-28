import { getDB } from "../../config/db.js";
import { validateAttendance } from "./studentAttendance.validation.js";
import { StudentAttendanceModel as Model } from "./studentAttendance.model.js";

/* ===========================================================
   MARK ATTENDANCE
   - Resolves & cross-validates admission_id and student_id
     against student_admissions table
   - period_no: 0 for daily attendance, >0 for period attendance
   - Populates created_by and updated_by audit columns
=========================================================== */
export const markAttendance = async (user, body) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const data = validateAttendance(body);

    await conn.beginTransaction();

    /* 1. USER VALIDATION */
    if (!user || !user.id) {
      throw { status: 401, message: "Invalid user token" };
    }

    /* 2. CLASS SECTION CHECK */
    const [[classInfo]] = await conn.query(
      `
      SELECT cs.id, cs.school_id, cs.academic_year_id, cs.class_id, cs.section_id,
             c.name AS class_name, s.name AS section_name
      FROM class_sections cs
      JOIN classes c ON cs.class_id = c.id
      JOIN sections s ON cs.section_id = s.id
      WHERE cs.id = ?
      `,
      [data.class_section_id],
    );

    if (!classInfo) {
      throw { status: 404, message: "Class section not found" };
    }

    /* 3. STRICT RETRIEVE & CROSS-VALIDATE STUDENT_ID AND ADMISSION_ID WITH RELATED TABLES */
    const candidateIds = new Set();
    data.students.forEach((s) => {
      if (s.admission_id) candidateIds.add(Number(s.admission_id));
      if (s.student_id) candidateIds.add(Number(s.student_id));
    });

    const ids = Array.from(candidateIds);
    let validAdmissions = [];

    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      // Verify directly against student_admissions, students, and active section allocation
      const [rows] = await conn.query(
        `
        SELECT 
          sa.id AS admission_id,
          sa.student_id,
          sa.school_id,
          sa.class_id,
          sa.academic_year_id,
          st.id AS verified_student_id,
          st.first_name,
          st.last_name,
          ssa.roll_no,
          ssa.class_section_id
        FROM student_admissions sa
        INNER JOIN students st ON sa.student_id = st.id
        INNER JOIN student_section_allocations ssa ON sa.id = ssa.admission_id
          AND ssa.class_section_id = ?
          AND ssa.status = 'active'
          AND (ssa.effective_to IS NULL OR ssa.effective_to >= ?)
        WHERE sa.school_id = ?
          AND sa.class_id = ?
          AND (sa.academic_year_id = ? OR sa.academic_year_id = (
            SELECT id FROM academic_years 
            WHERE name = (SELECT name FROM academic_years WHERE id = ?) 
              AND school_id = ? 
            LIMIT 1
          ))
          AND sa.status = 'active'
          AND (sa.id IN (${placeholders}) OR sa.student_id IN (${placeholders}))
        `,
        [
          data.class_section_id,
          data.attendance_date,
          classInfo.school_id,
          classInfo.class_id,
          classInfo.academic_year_id,
          classInfo.academic_year_id,
          classInfo.school_id,
          ...ids,
          ...ids,
        ],
      );
      validAdmissions = rows;
    }

    const byAdmissionId = new Map();
    const byStudentId = new Map();

    for (const row of validAdmissions) {
      byAdmissionId.set(Number(row.admission_id), row);
      byStudentId.set(Number(row.student_id), row);
    }

    const resolvedStudents = [];
    const invalidStudents = [];

    for (let i = 0; i < data.students.length; i++) {
      const s = data.students[i];
      const inputAdmId = s.admission_id ? Number(s.admission_id) : null;
      const inputStId = s.student_id ? Number(s.student_id) : null;

      let matchedRow = null;

      // 1. If admission_id is provided, match by admission_id
      if (inputAdmId && byAdmissionId.has(inputAdmId)) {
        matchedRow = byAdmissionId.get(inputAdmId);

        // If student_id was also provided, strictly cross-validate they belong to each other
        if (inputStId && Number(matchedRow.student_id) !== inputStId) {
          invalidStudents.push(
            `Mismatch: admission_id ${inputAdmId} belongs to student_id ${matchedRow.student_id}, not student_id ${inputStId}`
          );
          continue;
        }
      } 
      // 2. If only student_id is provided, match by student_id
      else if (inputStId && byStudentId.has(inputStId)) {
        matchedRow = byStudentId.get(inputStId);
      }

      if (!matchedRow) {
        invalidStudents.push(
          `[admission_id: ${s.admission_id || "N/A"}, student_id: ${s.student_id || "N/A"}] (not actively enrolled in ${classInfo.class_name} ${classInfo.section_name})`
        );
      } else {
        // Enforce the canonical verified admission_id and student_id from the database
        resolvedStudents.push({
          admission_id: Number(matchedRow.admission_id),
          student_id: Number(matchedRow.student_id),
          status: s.status,
          remarks: s.remarks || null,
        });
      }
    }

    if (invalidStudents.length > 0) {
      throw {
        status: 400,
        message: `Active admission record not found for student(s): ${invalidStudents.join(", ")} in class '${classInfo.class_name}' section '${classInfo.section_name}'`,
      };
    }

    /* 4. ATTENDANCE SESSION (FIND OR CREATE) */
    let session = await Model.findSession(
      conn,
      classInfo.school_id,
      classInfo.academic_year_id,
      data.class_section_id,
      data.attendance_date,
      data.attendance_type,
      data.period_no, // 0 for daily, >0 for period
    );

    let sessionId;
    let isNewSession = false;

    if (!session) {
      sessionId = await Model.createSession(conn, {
        school_id: classInfo.school_id,
        academic_year_id: classInfo.academic_year_id,
        class_section_id: data.class_section_id,
        attendance_date: data.attendance_date,
        attendance_type: data.attendance_type,
        period_no: data.period_no, // 0 for daily, >0 for period
        remarks: data.remarks || null,
        created_by: user.id,
        updated_by: user.id,
        is_locked: false,
      });
      isNewSession = true;
    } else {
      if (session.is_locked) {
        throw { status: 400, message: "Attendance session is locked" };
      }

      // Check if student attendance records are already taken for this session
      const [[attCount]] = await conn.query(
        `SELECT COUNT(*) AS count FROM student_attendance WHERE attendance_session_id = ?`,
        [session.id],
      );

      const alreadyTaken = Number(attCount?.count || 0) > 0;

      // If already taken and allow_update flag is not passed, throw 409 Conflict with clear message
      if (alreadyTaken && !data.allow_update) {
        const periodDesc =
          data.attendance_type === "period"
            ? `Period ${data.period_no}`
            : "Daily Attendance";

        throw {
          status: 409,
          message: `Attendance has already been taken for Class '${classInfo.class_name}' Section '${classInfo.section_name}' on ${data.attendance_date} (${periodDesc}). Set 'allow_update': true to update existing records.`,
          already_taken: true,
          attendance_session_id: session.id,
          class_section_id: data.class_section_id,
          attendance_date: data.attendance_date,
          attendance_type: data.attendance_type,
          period_no: data.period_no,
        };
      }

      sessionId = session.id;

      await conn.query(
        `UPDATE student_attendance_sessions 
         SET updated_by = ?, remarks = COALESCE(?, remarks) 
         WHERE id = ?`,
        [user.id, data.remarks || null, sessionId],
      );
    }

    /* 5. BULK UPSERT WITH STUDENT_ID AND AUDIT FIELDS */
    const values = resolvedStudents.map((s) => [
      sessionId,
      s.admission_id,
      s.student_id,
      s.status,
      s.remarks,
      user.id, // created_by
      user.id, // updated_by
    ]);

    await Model.bulkUpsert(conn, values);

    await conn.commit();

    return {
      success: true,
      message: isNewSession
        ? "Attendance saved successfully"
        : "Attendance has already been taken for this session. Records updated successfully.",
      already_taken: !isNewSession,
      attendance_session_id: sessionId,
      school_id: classInfo.school_id,
      attendance_type: data.attendance_type,
      period_no: data.period_no,
      total_students: resolvedStudents.length,
      is_new_session: isNewSession,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* ===========================================================
   GET ALL ATTENDANCE
=========================================================== */
export const getAllAttendance = async (filters = {}) => {
  const db = getDB();

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,
      sa.created_by,
      sa.updated_by,
      sa.created_at,
      sa.updated_at,

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
      ssa.roll_no,

      u_creator.username AS created_by_name,
      u_updater.username AS updated_by_name,
      emp.id AS marked_by_id,
      COALESCE(CONCAT(emp.first_name, ' ', COALESCE(emp.last_name, '')), u_creator.username) AS marked_by_name,

      sc.id AS school_id,
      sc.name AS school_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON sa.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    LEFT JOIN student_section_allocations ssa
      ON adm.id = ssa.admission_id
      AND ssa.class_section_id = cs.id
      AND ssa.status = 'active'
      AND (ssa.effective_to IS NULL OR ssa.effective_to >= sas.attendance_date)

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN schools sc 
      ON sas.school_id = sc.id

    LEFT JOIN users u_creator 
      ON sa.created_by = u_creator.id

    LEFT JOIN users u_updater 
      ON sa.updated_by = u_updater.id

    LEFT JOIN employees emp 
      ON emp.user_id = u_creator.id

    WHERE 1=1
  `;

  const values = [];

  if (filters.school_id) {
    query += ` AND sas.school_id = ?`;
    values.push(filters.school_id);
  }

  if (filters.class_id) {
    query += ` AND (cs.class_id = ? OR c.name = ?)`;
    values.push(filters.class_id, filters.class_id);
  }

  if (filters.academic_year_id) {
    query += ` AND (sas.academic_year_id = ? OR sas.academic_year_id = (SELECT id FROM academic_years WHERE name = (SELECT name FROM academic_years WHERE id = ?) AND school_id = sas.school_id LIMIT 1))`;
    values.push(filters.academic_year_id, filters.academic_year_id);
  }

  if (filters.section) {
    query += ` AND (s.name = ? OR cs.section_id = ?)`;
    values.push(filters.section, filters.section);
  }

  if (filters.attendance_type) {
    query += ` AND sas.attendance_type = ?`;
    values.push(filters.attendance_type);
  }

  if (filters.period_no !== undefined && filters.period_no !== null && filters.period_no !== "") {
    query += ` AND sas.period_no = ?`;
    values.push(Number(filters.period_no));
  }

  if (filters.date) {
    query += ` AND sas.attendance_date = ?`;
    values.push(filters.date);
  }

  if (filters.class_section_id) {
    query += ` AND sas.class_section_id = ?`;
    values.push(filters.class_section_id);
  }

  if (filters.student_id && filters.admission_id) {
    query += ` AND sa.student_id = ? AND sa.admission_id = ?`;
    values.push(filters.student_id, filters.admission_id);
  } else if (filters.student_id) {
    query += ` AND (sa.student_id = ? OR sa.admission_id = ?)`;
    values.push(filters.student_id, filters.student_id);
  } else if (filters.admission_id) {
    query += ` AND (sa.admission_id = ? OR sa.student_id = ?)`;
    values.push(filters.admission_id, filters.admission_id);
  }

  query += ` ORDER BY sas.attendance_date DESC, sa.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

/* ===========================================================
   GET ALL BY TOKEN (SCOPED TO USER'S SCHOOL)
=========================================================== */
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
      sa.created_by,
      sa.updated_by,
      sa.created_at,
      sa.updated_at,

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

      adm.id AS admission_id,
      ssa.roll_no,

      u_creator.username AS created_by_name,
      u_updater.username AS updated_by_name,
      emp.id AS marked_by_id,
      COALESCE(CONCAT(emp.first_name, ' ', COALESCE(emp.last_name, '')), u_creator.username) AS marked_by_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN schools sc 
      ON sas.school_id = sc.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON sa.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    LEFT JOIN student_section_allocations ssa
      ON adm.id = ssa.admission_id
      AND ssa.class_section_id = cs.id
      AND ssa.status = 'active'
      AND (ssa.effective_to IS NULL OR ssa.effective_to >= sas.attendance_date)

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    LEFT JOIN users u_creator 
      ON sa.created_by = u_creator.id

    LEFT JOIN users u_updater 
      ON sa.updated_by = u_updater.id

    LEFT JOIN employees emp 
      ON emp.user_id = u_creator.id

    WHERE 1=1
  `;

  const values = [];

  // Scoping: If admin passed school_id in query, filter by it; non-admin is scoped to token's school_id
  if (filters.school_id) {
    query += ` AND sas.school_id = ?`;
    values.push(filters.school_id);
  } else if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned to user" };
    }
    query += ` AND sas.school_id = ?`;
    values.push(user.school_id);
  }

  if (filters.class_id) {
    query += ` AND cs.class_id = ?`;
    values.push(filters.class_id);
  }

  if (filters.academic_year_id) {
    query += ` AND sas.academic_year_id = ?`;
    values.push(filters.academic_year_id);
  }

  if (filters.attendance_type) {
    query += ` AND sas.attendance_type = ?`;
    values.push(filters.attendance_type);
  }

  if (filters.period_no !== undefined && filters.period_no !== null && filters.period_no !== "") {
    query += ` AND sas.period_no = ?`;
    values.push(Number(filters.period_no));
  }

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

  if (filters.student_id && filters.admission_id) {
    query += ` AND sa.student_id = ? AND sa.admission_id = ?`;
    values.push(filters.student_id, filters.admission_id);
  } else if (filters.student_id) {
    query += ` AND (sa.student_id = ? OR sa.admission_id = ?)`;
    values.push(filters.student_id, filters.student_id);
  } else if (filters.admission_id) {
    query += ` AND (sa.admission_id = ? OR sa.student_id = ?)`;
    values.push(filters.admission_id, filters.admission_id);
  }

  if (filters.status) {
    query += ` AND sa.attendance_status = ?`;
    values.push(filters.status);
  }

  query += ` ORDER BY sas.attendance_date DESC, ssa.roll_no ASC`;

  if (filters.limit) {
    const limit = Number(filters.limit) || 50;
    const offset = Number(filters.offset) || 0;

    query += ` LIMIT ? OFFSET ?`;
    values.push(limit, offset);
  }

  const [rows] = await db.query(query, values);
  return rows;
};

/* ===========================================================
   GET BY SESSION ID
=========================================================== */
export const getAttendanceBySession = async (session_id, user) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "session_id required" };
  }

  const [[session]] = await db.query(
    `SELECT id, school_id, attendance_date, attendance_type, period_no, class_section_id, is_locked, remarks
     FROM student_attendance_sessions
     WHERE id = ?`,
    [session_id],
  );

  if (!session) {
    throw { status: 404, message: "Session not found" };
  }

  if (user?.school_id && session.school_id !== user.school_id) {
    throw { status: 403, message: "Unauthorized access" };
  }

  const [rows] = await db.query(
    `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,
      sa.created_by,
      sa.updated_by,

      adm.id AS admission_id,
      ssa.roll_no,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      u_creator.username AS created_by_name,
      u_updater.username AS updated_by_name,
      COALESCE(CONCAT(emp.first_name, ' ', COALESCE(emp.last_name, '')), u_creator.username) AS marked_by_name

    FROM student_attendance sa

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON sa.student_id = st.id

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    LEFT JOIN student_section_allocations ssa
      ON adm.id = ssa.admission_id
      AND ssa.class_section_id = cs.id
      AND ssa.status = 'active'
      AND (ssa.effective_to IS NULL OR ssa.effective_to >= sas.attendance_date)

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    LEFT JOIN users u_creator 
      ON sa.created_by = u_creator.id

    LEFT JOIN users u_updater 
      ON sa.updated_by = u_updater.id

    LEFT JOIN employees emp 
      ON emp.user_id = u_creator.id

    WHERE sa.attendance_session_id = ?

    ORDER BY ssa.roll_no ASC
    `,
    [session_id],
  );

  return {
    session,
    students: rows,
  };
};

/* ===========================================================
   GET BY ID
=========================================================== */
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
      sa.created_by,
      sa.updated_by,
      sa.created_at,
      sa.updated_at,

      sas.id AS session_id,
      sas.attendance_date,
      sas.attendance_type,
      sas.period_no,
      sas.is_locked,

      adm.id AS admission_id,
      ssa.roll_no,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      u_creator.username AS created_by_name,
      u_updater.username AS updated_by_name,
      emp.id AS marked_by_id,
      COALESCE(CONCAT(emp.first_name, ' ', COALESCE(emp.last_name, '')), u_creator.username) AS marked_by_name,

      sc.id AS school_id,
      sc.name AS school_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON sa.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    LEFT JOIN student_section_allocations ssa
      ON adm.id = ssa.admission_id
      AND ssa.class_section_id = cs.id
      AND ssa.status = 'active'
      AND (ssa.effective_to IS NULL OR ssa.effective_to >= sas.attendance_date)

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN schools sc 
      ON sas.school_id = sc.id

    LEFT JOIN users u_creator 
      ON sa.created_by = u_creator.id

    LEFT JOIN users u_updater 
      ON sa.updated_by = u_updater.id

    LEFT JOIN employees emp 
      ON emp.user_id = u_creator.id

    WHERE sa.id = ?
    `,
    [id],
  );

  if (!row) {
    throw { status: 404, message: "Attendance not found" };
  }

  return row;
};

/* ===========================================================
   GET ATTENDANCE BY STUDENT (MATCHES STUDENT_ID OR ADMISSION_ID)
=========================================================== */
export const getAttendanceByStudent = async (studentIdentifier, filters = {}) => {
  const db = getDB();

  if (!studentIdentifier) {
    throw { status: 400, message: "student_id or admission_id required" };
  }

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,
      sa.student_id,
      sa.admission_id,
      sa.created_by,
      sa.updated_by,

      sas.attendance_date,
      sas.period_no,
      sas.attendance_type,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      u_creator.username AS created_by_name,
      COALESCE(CONCAT(emp.first_name, ' ', COALESCE(emp.last_name, '')), u_creator.username) AS marked_by_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    LEFT JOIN users u_creator 
      ON sa.created_by = u_creator.id

    LEFT JOIN employees emp 
      ON emp.user_id = u_creator.id

    WHERE (sa.admission_id = ? OR sa.student_id = ?)
  `;

  const values = [studentIdentifier, studentIdentifier];

  if (filters.date || filters.attendance_date) {
    query += ` AND sas.attendance_date = ?`;
    values.push(filters.date || filters.attendance_date);
  }

  if (filters.from_date) {
    query += ` AND sas.attendance_date >= ?`;
    values.push(filters.from_date);
  }

  if (filters.to_date) {
    query += ` AND sas.attendance_date <= ?`;
    values.push(filters.to_date);
  }

  if (filters.attendance_type && filters.attendance_type !== "all") {
    const types = filters.attendance_type.split(",").map(t => t.trim()).filter(Boolean);
    if (types.length > 0) {
      query += ` AND sas.attendance_type IN (?)`;
      values.push(types);
    }
  }

  if (filters.status && filters.status !== "All") {
    query += ` AND sa.attendance_status = ?`;
    values.push(filters.status);
  }

  if (filters.period_no !== undefined && filters.period_no !== null && filters.period_no !== "" && filters.period_no !== "All") {
    query += ` AND sas.period_no = ?`;
    values.push(Number(filters.period_no));
  }

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    query += ` AND (sa.remarks LIKE ? OR u_creator.username LIKE ? OR emp.first_name LIKE ? OR emp.last_name LIKE ? OR c.name LIKE ? OR s.name LIKE ? OR sa.attendance_status LIKE ?)`;
    values.push(term, term, term, term, term, term, term);
  }

  query += ` ORDER BY sas.attendance_date DESC, sas.period_no ASC`;

  const [rows] = await db.query(query, values);

  const dailyMap = {};
  const periodMap = {};

  rows.forEach((r) => {
    const record = {
      attendance_id: r.id,
      student_id: r.student_id,
      admission_id: r.admission_id,
      status: r.attendance_status,
      remarks: r.remarks,
      class_section_id: r.class_section_id,
      class_name: r.class_name,
      section_name: r.section_name,
      marked_by: r.marked_by_name,
      created_by: r.created_by,
      updated_by: r.updated_by,
    };

    const date = r.attendance_date;

    if (r.attendance_type === "daily") {
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          records: [],
        };
      }
      dailyMap[date].records.push(record);
    }

    if (r.attendance_type === "period") {
      if (!periodMap[date]) {
        periodMap[date] = {
          date,
          periods: {},
        };
      }

      if (!periodMap[date].periods[r.period_no]) {
        periodMap[date].periods[r.period_no] = {
          period_no: r.period_no,
          records: [],
        };
      }

      periodMap[date].periods[r.period_no].records.push(record);
    }
  });

  const daily = Object.values(dailyMap);

  const period = Object.values(periodMap).map((d) => ({
    date: d.date,
    periods: Object.values(d.periods),
  }));

  return {
    student_id: rows[0]?.student_id || studentIdentifier,
    admission_id: rows[0]?.admission_id || studentIdentifier,
    summary: {
      total_records: rows.length,
      daily_count: daily.length,
      period_count: period.length,
    },
    data: {
      daily,
      period,
    },
  };
};

/* ===========================================================
   GET ATTENDANCE BY DATE
=========================================================== */
export const getAttendanceByDate = async (filters = {}) => {
  const db = getDB();

  const targetDate = filters.date || filters.attendance_date;
  if (!targetDate) {
    throw { status: 400, message: "date required" };
  }

  let query = `
    SELECT 
      sa.id,
      sa.attendance_status,
      sa.remarks,
      sa.created_by,
      sa.updated_by,

      sas.attendance_date,
      sas.period_no,
      sas.attendance_type,

      cs.id AS class_section_id,
      c.name AS class_name,
      s.name AS section_name,

      st.id AS student_id,
      st.first_name,
      st.last_name,

      adm.id AS admission_id,
      ssa.roll_no,

      u_creator.username AS created_by_name,
      COALESCE(CONCAT(emp.first_name, ' ', COALESCE(emp.last_name, '')), u_creator.username) AS marked_by_name

    FROM student_attendance sa

    JOIN student_attendance_sessions sas 
      ON sa.attendance_session_id = sas.id

    JOIN student_admissions adm 
      ON sa.admission_id = adm.id

    JOIN students st 
      ON sa.student_id = st.id

    JOIN class_sections cs 
      ON sas.class_section_id = cs.id

    LEFT JOIN student_section_allocations ssa
      ON adm.id = ssa.admission_id
      AND ssa.class_section_id = cs.id
      AND ssa.status = 'active'
      AND (ssa.effective_to IS NULL OR ssa.effective_to >= sas.attendance_date)

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    LEFT JOIN users u_creator 
      ON sa.created_by = u_creator.id

    LEFT JOIN employees emp 
      ON emp.user_id = u_creator.id

    WHERE sas.attendance_date = ?
  `;

  const values = [targetDate];

  if (filters.class_section_id) {
    query += ` AND sas.class_section_id = ?`;
    values.push(filters.class_section_id);
  }

  query += ` ORDER BY c.name, s.name, ssa.roll_no`;

  const [rows] = await db.query(query, values);
  return rows;
};

/* ===========================================================
   UPDATE ATTENDANCE RECORD
=========================================================== */
export const updateAttendance = async (id, data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const oldAttendance = await Model.findById(conn, id);
    if (!oldAttendance) throw { status: 404, message: "Attendance not found" };

    const [[session]] = await conn.query(
      `SELECT id, is_locked, school_id FROM student_attendance_sessions WHERE id = ?`,
      [oldAttendance.attendance_session_id],
    );

    if (session?.is_locked) {
      throw { status: 400, message: "Attendance session is locked" };
    }

    const updatePayload = {
      attendance_status: data.status || oldAttendance.attendance_status,
      remarks: data.remarks !== undefined ? data.remarks : oldAttendance.remarks,
      updated_by: user?.id || null,
    };

    await Model.update(conn, id, updatePayload);

    const updatedAttendance = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Attendance updated successfully",
      school_id: session?.school_id,
      oldAttendance,
      updatedAttendance,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* ===========================================================
   DELETE ATTENDANCE RECORD
=========================================================== */
export const deleteAttendance = async (id, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const deletedAttendance = await Model.findById(conn, id);
    if (!deletedAttendance) throw { status: 404, message: "Attendance not found" };

    const [[session]] = await conn.query(
      `SELECT id, is_locked, school_id FROM student_attendance_sessions WHERE id = ?`,
      [deletedAttendance.attendance_session_id],
    );

    if (session?.is_locked) {
      throw { status: 400, message: "Attendance session is locked" };
    }

    await Model.delete(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Attendance deleted successfully",
      school_id: session?.school_id,
      deletedAttendance,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* ===========================================================
   LOCK ATTENDANCE SESSION
=========================================================== */
export const lockAttendanceSession = async (session_id, user) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "session_id required" };
  }

  const [[session]] = await db.query(
    `SELECT id, is_locked, school_id 
     FROM student_attendance_sessions 
     WHERE id = ?`,
    [session_id],
  );

  if (!session) {
    throw { status: 404, message: "Session not found" };
  }

  if (user?.school_id && session.school_id !== user.school_id) {
    throw { status: 403, message: "Unauthorized access" };
  }

  if (session.is_locked) {
    throw { status: 400, message: "Session already locked" };
  }

  await db.query(
    `UPDATE student_attendance_sessions SET is_locked = 1, updated_by = ? WHERE id = ?`,
    [user?.id || null, session_id],
  );

  return {
    success: true,
    message: "Session locked successfully",
    school_id: session.school_id,
    session_id,
  };
};

/* ===========================================================
   UNLOCK ATTENDANCE SESSION
=========================================================== */
export const unlockAttendanceSession = async (session_id, user) => {
  const db = getDB();

  if (!session_id) {
    throw { status: 400, message: "session_id required" };
  }

  const [[session]] = await db.query(
    `SELECT id, is_locked, school_id 
     FROM student_attendance_sessions 
     WHERE id = ?`,
    [session_id],
  );

  if (!session) {
    throw { status: 404, message: "Session not found" };
  }

  if (user?.school_id && session.school_id !== user.school_id) {
    throw { status: 403, message: "Unauthorized access" };
  }

  if (!session.is_locked) {
    throw { status: 400, message: "Session already unlocked" };
  }

  await db.query(
    `UPDATE student_attendance_sessions SET is_locked = 0, updated_by = ? WHERE id = ?`,
    [user?.id || null, session_id],
  );

  return {
    success: true,
    message: "Session unlocked successfully",
    school_id: session.school_id,
    session_id,
  };
};

/* ===========================================================
   ATTENDANCE SUMMARY
=========================================================== */
export const getAttendanceSummary = async (filters = {}) => {
  const db = getDB();

  let query = `
    SELECT 
      COUNT(sa.id) AS total_records,
      SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END) AS total_present,
      SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END) AS total_absent,
      SUM(CASE WHEN sa.attendance_status = 'late' THEN 1 ELSE 0 END) AS total_late,
      SUM(CASE WHEN sa.attendance_status = 'half_day' THEN 1 ELSE 0 END) AS total_half_day,
      SUM(CASE WHEN sa.attendance_status = 'leave' THEN 1 ELSE 0 END) AS total_leave
    FROM student_attendance sa
    JOIN student_attendance_sessions sas ON sa.attendance_session_id = sas.id
    WHERE 1=1
  `;
  const values = [];

  const targetDate = filters.date || filters.attendance_date;
  if (targetDate) {
    query += ` AND sas.attendance_date = ?`;
    values.push(targetDate);
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

  if (filters.school_id) {
    query += ` AND sas.school_id = ?`;
    values.push(filters.school_id);
  }

  if (filters.academic_year_id) {
    query += ` AND sas.academic_year_id = ?`;
    values.push(filters.academic_year_id);
  }

  const [[row]] = await db.query(query, values);

  return {
    total_records: Number(row?.total_records || 0),
    total_present: Number(row?.total_present || 0),
    total_absent: Number(row?.total_absent || 0),
    total_late: Number(row?.total_late || 0),
    total_half_day: Number(row?.total_half_day || 0),
    total_leave: Number(row?.total_leave || 0),
  };
};

/* ===========================================================
   CHECK IF ATTENDANCE IS ALREADY TAKEN
=========================================================== */
export const checkAttendanceTaken = async (params = {}) => {
  const db = getDB();

  if (!params.class_section_id) {
    throw { status: 400, message: "class_section_id required" };
  }
  if (!params.attendance_date) {
    throw { status: 400, message: "attendance_date required" };
  }

  const attendance_type = params.attendance_type || "daily";
  const period_no = attendance_type === "period" ? Number(params.period_no || 1) : 0;

  const [[classInfo]] = await db.query(
    `
    SELECT cs.id, cs.school_id, cs.academic_year_id, c.name AS class_name, s.name AS section_name
    FROM class_sections cs
    JOIN classes c ON cs.class_id = c.id
    JOIN sections s ON cs.section_id = s.id
    WHERE cs.id = ?
    `,
    [params.class_section_id],
  );

  if (!classInfo) {
    throw { status: 404, message: "Class section not found" };
  }

  const [[session]] = await db.query(
    `
    SELECT id, school_id, academic_year_id, class_section_id, attendance_date, attendance_type, period_no, is_locked, remarks, created_at, updated_at
    FROM student_attendance_sessions
    WHERE class_section_id = ?
      AND attendance_date = ?
      AND attendance_type = ?
      AND period_no = ?
    `,
    [params.class_section_id, params.attendance_date, attendance_type, period_no],
  );

  if (!session) {
    return {
      already_taken: false,
      message: "Attendance has not been taken yet",
      class_name: classInfo.class_name,
      section_name: classInfo.section_name,
      attendance_date: params.attendance_date,
      attendance_type,
      period_no,
    };
  }

  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total_marked FROM student_attendance WHERE attendance_session_id = ?`,
    [session.id],
  );

  const totalMarked = Number(countRow?.total_marked || 0);
  const already_taken = totalMarked > 0;
  const periodDesc = attendance_type === "period" ? `Period ${period_no}` : "Daily Attendance";

  return {
    already_taken,
    message: already_taken
      ? `Attendance has already been taken for Class '${classInfo.class_name}' Section '${classInfo.section_name}' on ${params.attendance_date} (${periodDesc}). Total students marked: ${totalMarked}.`
      : "Attendance session exists but no attendance records have been marked yet",
    total_marked: totalMarked,
    is_locked: Boolean(session.is_locked),
    session,
  };
};

