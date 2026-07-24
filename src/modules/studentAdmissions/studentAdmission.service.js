import { getDB } from "../../config/db.js";
import { StudentAdmissionModel } from "./studentAdmission.model.js";
import {
  validateCreateAdmission,
  validateUpdateAdmission,
} from "./studentAdmission.validation.js";

const generateAdmissionNumber = async (conn, school_id) => {
  const [[row]] = await conn.query(
    `SELECT COUNT(*) as total FROM student_admissions sa
     JOIN students s ON sa.student_id = s.id
     WHERE s.school_id=?`,
    [school_id],
  );

  return `ADM-${String(row.total + 1).padStart(5, "0")}`;
};

// export const createAdmission = async (data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateCreateAdmission(data);

//     await conn.beginTransaction();

//     // ✅ STUDENT CHECK
//     const [[student]] = await conn.query(
//       `SELECT id, school_id FROM students WHERE id=?`,
//       [validated.student_id],
//     );

//     if (!student) {
//       throw { status: 404, message: "Student not found" };
//     }

//     // 🔴 BLOCK DUPLICATE (CRITICAL FIX)
//     const [[existing]] = await conn.query(
//       `SELECT id FROM student_admissions
//        WHERE student_id=? AND academic_year_id=?`,
//       [validated.student_id, validated.academic_year_id],
//     );

//     if (existing) {
//       throw {
//         status: 409,
//         message: "Student already admitted for this academic year",
//       };
//     }

//     // ✅ ACADEMIC YEAR
//     const [[year]] = await conn.query(
//       `SELECT id, name FROM academic_years WHERE id=?`,
//       [validated.academic_year_id],
//     );

//     if (!year) {
//       throw { status: 404, message: "Academic year not found" };
//     }

//     // ✅ CLASS
//     const [[cls]] = await conn.query(
//       `SELECT id, name FROM classes WHERE id=?`,
//       [validated.class_id],
//     );

//     if (!cls) {
//       throw { status: 404, message: "Class not found" };
//     }

//     // ✅ COUNT FOR ADMISSION NUMBER
//     const [[countRow]] = await conn.query(
//       `SELECT COUNT(*) as total FROM student_admissions
//        WHERE academic_year_id=?`,
//       [validated.academic_year_id],
//     );

//     const admission_number = `ADM-${year.name}-${String(
//       countRow.total + 1,
//     ).padStart(4, "0")}`;

//     // ✅ FINAL DATA
//     const insertData = {
//       ...validated,
//       admission_number,
//       admission_date: new Date(),
//       academic_year: year.name,
//       class_name: cls.name,
//       status: "active",
//     };

//     const id = await StudentAdmissionModel.create(conn, insertData);

//     await conn.commit();

//     // 🔥 FULL RESPONSE (NOT JUST ID)
//     return {
//       message: "Admission created successfully",
//       data: {
//         id,
//         student_id: validated.student_id,
//         admission_number,
//         admission_date: insertData.admission_date,
//         academic_year_id: validated.academic_year_id,
//         academic_year: year.name,
//         class_id: validated.class_id,
//         class_name: cls.name,
//         section: validated.section,
//         roll_no: validated.roll_no,
//         joining_date: validated.joining_date,
//         subject_group: validated.subject_group,
//         transport_required: validated.transport_required,
//         hostel_required: validated.hostel_required,
//         admission_type: validated.admission_type,
//         status: "active",
//       },
//     };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

export const createAdmission = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateAdmission(data);

    await conn.beginTransaction();

    /* ======================================================
       STUDENT
    ====================================================== */

    const [[student]] = await conn.query(
      `
      SELECT
          id,
          school_id,
          first_name,
          last_name
      FROM students
      WHERE id = ?
      `,
      [validated.student_id],
    );

    if (!student) {
      throw {
        status: 404,
        message: "Student not found",
      };
    }

    /* ======================================================
       ACADEMIC YEAR
    ====================================================== */

    const [[year]] = await conn.query(
      `
      SELECT
          id,
          name,
          is_current
      FROM academic_years
      WHERE id = ?
      `,
      [validated.academic_year_id],
    );

    if (!year) {
      throw {
        status: 404,
        message: "Academic year not found",
      };
    }

    /* ======================================================
       CLASS
    ====================================================== */

    const [[cls]] = await conn.query(
      `
      SELECT
          id,
          school_id,
          name
      FROM classes
      WHERE id = ?
      `,
      [validated.class_id],
    );

    if (!cls) {
      throw {
        status: 404,
        message: "Class not found",
      };
    }

    if (cls.school_id !== student.school_id) {
      throw {
        status: 400,
        message: "Student and class belong to different schools",
      };
    }

    /* ======================================================
       LOCK PREVIOUS ADMISSION
    ====================================================== */

    const [[activeAdmission]] = await conn.query(
      `
      SELECT
          id,
          academic_year_id,
          status
      FROM student_admissions
      WHERE student_id = ?
        AND status='active'
      FOR UPDATE
      `,
      [validated.student_id],
    );

    /* ======================================================
       SAME YEAR CHECK
    ====================================================== */

    if (
      activeAdmission &&
      Number(activeAdmission.academic_year_id) ===
        Number(validated.academic_year_id)
    ) {
      throw {
        status: 409,
        message: "Student already admitted for this academic year",
      };
    }

    /* ======================================================
       DUPLICATE CHECK
    ====================================================== */

    const [[duplicate]] = await conn.query(
      `
      SELECT id
      FROM student_admissions
      WHERE student_id=?
      AND academic_year_id=?
      `,
      [validated.student_id, validated.academic_year_id],
    );

    if (duplicate) {
      throw {
        status: 409,
        message: "Student already admitted for this academic year",
      };
    }

    /* ======================================================
       COMPLETE PREVIOUS YEAR
    ====================================================== */

    if (activeAdmission) {
      await conn.query(
        `
        UPDATE student_admissions
        SET status='completed'
        WHERE id=?
        `,
        [activeAdmission.id],
      );
    }

    /* ======================================================
       ADMISSION NUMBER
    ====================================================== */

    const [[count]] = await conn.query(
      `
      SELECT COUNT(*) total
      FROM student_admissions
      WHERE academic_year_id=?
      `,
      [validated.academic_year_id],
    );

    const admission_number = `ADM-${year.name}-${String(
      count.total + 1,
    ).padStart(4, "0")}`;

    /* ======================================================
       INSERT
    ====================================================== */

    const admissionData = {
      school_id: student.school_id,

      student_id: validated.student_id,

      admission_number,

      admission_date: new Date(),

      academic_year_id: year.id,
      academic_year: year.name,

      class_id: cls.id,
      class_name: cls.name,

      section: validated.section,

      roll_no: validated.roll_no,

      joining_date: validated.joining_date,

      subject_group: validated.subject_group,

      transport_required: validated.transport_required,

      hostel_required: validated.hostel_required,

      admission_type: validated.admission_type,

      status: "active",
    };

    const id = await StudentAdmissionModel.create(conn, admissionData);

    await conn.commit();

    return {
      message: "Student admitted successfully",
      data: {
        id,
        ...admissionData,
      },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateAdmission = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const validated = validateUpdateAdmission(data);

    if (!Object.keys(validated).length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await conn.beginTransaction();

    const existing = await StudentAdmissionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Admission not found" };
    }

    await StudentAdmissionModel.update(conn, id, validated);

    await conn.commit();

    return { message: "Admission updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteAdmission = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await StudentAdmissionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Not found" };
    }

    await StudentAdmissionModel.delete(conn, id);

    await conn.commit();

    return { message: "Deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAdmissions = async (filters) => {
  try {
    const admissions = await StudentAdmissionModel.getAll(filters);
    return admissions;
  } catch (err) {
    throw err;
  }
};

export const getAllAdmissionsByToken = async (user) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // Get latest user + roles
  const [[dbUser]] = await db.query(
    `
    SELECT
      u.id,
      u.school_id,
      GROUP_CONCAT(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = ?
    GROUP BY u.id
    `,
    [user.id],
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const roles = dbUser.roles
    ? dbUser.roles.split(",").map((r) => r.trim())
    : [];

  const isAdmin = roles.includes("ADMIN");

  const filters = {};

  // Non-admin users can only view their own school's admissions
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw {
        status: 400,
        message: "User has no school assigned",
      };
    }

    filters.school_id = dbUser.school_id;
  }

  return await StudentAdmissionModel.getAll(filters);
};

// export const getClassStudentSummaryByToken = async (user, filters = {}) => {
//   const db = getDB();

//   if (!user) {
//     throw {
//       status: 401,
//       message: "Unauthorized",
//     };
//   }

//   const isAdmin =
//     user.role === "ADMIN" ||
//     user.roles?.includes("ADMIN") ||
//     user.roles?.some((r) => r === "ADMIN" || r.name === "ADMIN");

//   /* -----------------------------
//      Academic Year
//   ------------------------------ */

//   let academicYearId = filters.academic_year_id;

//   if (!academicYearId) {
//     const [[year]] = await db.query(
//       `
//       SELECT id
//       FROM academic_years
//       WHERE is_current = 1
//       LIMIT 1
//       `,
//     );

//     if (!year) {
//       throw {
//         status: 404,
//         message: "Current academic year not found",
//       };
//     }

//     academicYearId = year.id;
//   }

//   /* -----------------------------
//       CLASS SUMMARY
//   ------------------------------ */

//   let summaryQuery = `
//       SELECT

//           c.id AS class_id,
//           c.name AS class_name,

//           sa.section,

//           COUNT(sa.id) AS total_students

//       FROM student_admissions sa

//       INNER JOIN classes c
//           ON c.id = sa.class_id

//       WHERE
//           sa.academic_year_id = ?
//           AND sa.status='active'
//   `;

//   const summaryValues = [academicYearId];

//   if (!isAdmin) {
//     if (!user.school_id) {
//       throw {
//         status: 400,
//         message: "No school assigned",
//       };
//     }

//     summaryQuery += ` AND c.school_id=?`;
//     summaryValues.push(user.school_id);
//   }

//   if (filters.class_id) {
//     summaryQuery += ` AND sa.class_id=?`;
//     summaryValues.push(filters.class_id);
//   }

//   if (filters.section) {
//     summaryQuery += ` AND sa.section=?`;
//     summaryValues.push(filters.section);
//   }

//   summaryQuery += `
//       GROUP BY
//           c.id,
//           c.name,
//           sa.section

//       ORDER BY
//           CASE
//               WHEN c.name='PRE KG' THEN 1
//               WHEN c.name='NURSERY' THEN 2
//               WHEN c.name='LKG' THEN 3
//               WHEN c.name='UKG' THEN 4

//               WHEN c.name='1' THEN 5
//               WHEN c.name='2' THEN 6
//               WHEN c.name='3' THEN 7
//               WHEN c.name='4' THEN 8
//               WHEN c.name='5' THEN 9
//               WHEN c.name='6' THEN 10
//               WHEN c.name='7' THEN 11
//               WHEN c.name='8' THEN 12
//               WHEN c.name='9' THEN 13
//               WHEN c.name='10' THEN 14
//               WHEN c.name='11' THEN 15
//               WHEN c.name='12' THEN 16

//               ELSE 999
//           END,
//           sa.section
//   `;

//   const [summary] = await db.query(summaryQuery, summaryValues);

//   /* -----------------------------
//       STUDENT LIST
//   ------------------------------ */

//   let students = [];

//   if (filters.include_students === "true") {
//     let studentQuery = `
//         SELECT

//             sa.id AS admission_id,
//             sa.admission_number,
//             sa.roll_no,

//             st.id AS student_id,
//             st.first_name,
//             st.last_name,
//             st.gender,
//             st.photo_url,

//             c.id AS class_id,
//             c.name AS class_name,

//             sa.section,

//             ay.id AS academic_year_id,
//             ay.name AS academic_year

//         FROM student_admissions sa

//         INNER JOIN students st
//             ON st.id = sa.student_id

//         INNER JOIN classes c
//             ON c.id = sa.class_id

//         INNER JOIN academic_years ay
//             ON ay.id = sa.academic_year_id

//         WHERE
//             sa.academic_year_id = ?
//             AND sa.status='active'
//     `;

//     const studentValues = [academicYearId];

//     if (!isAdmin) {
//       studentQuery += ` AND c.school_id=?`;
//       studentValues.push(user.school_id);
//     }

//     if (filters.class_id) {
//       studentQuery += ` AND sa.class_id=?`;
//       studentValues.push(filters.class_id);
//     }

//     if (filters.section) {
//       studentQuery += ` AND sa.section=?`;
//       studentValues.push(filters.section);
//     }

//     studentQuery += `
//         ORDER BY
//             CASE
//                 WHEN c.name='PRE KG' THEN 1
//                 WHEN c.name='NURSERY' THEN 2
//                 WHEN c.name='LKG' THEN 3
//                 WHEN c.name='UKG' THEN 4

//                 WHEN c.name='1' THEN 5
//                 WHEN c.name='2' THEN 6
//                 WHEN c.name='3' THEN 7
//                 WHEN c.name='4' THEN 8
//                 WHEN c.name='5' THEN 9
//                 WHEN c.name='6' THEN 10
//                 WHEN c.name='7' THEN 11
//                 WHEN c.name='8' THEN 12
//                 WHEN c.name='9' THEN 13
//                 WHEN c.name='10' THEN 14
//                 WHEN c.name='11' THEN 15
//                 WHEN c.name='12' THEN 16

//                 ELSE 999
//             END,
//             sa.section,
//             CAST(sa.roll_no AS UNSIGNED),
//             st.first_name
//     `;

//     const [rows] = await db.query(studentQuery, studentValues);

//     students = rows;
//   }

//   return {
//     academic_year_id: academicYearId,
//     total_classes: summary.length,
//     summary,
//     students,
//   };
// };

export const getClassStudentSummaryByToken = async (user, filters = {}) => {
  const db = getDB();

  if (!user) {
    throw {
      status: 401,
      message: "Unauthorized",
    };
  }

  const isAdmin =
    user.role === "ADMIN" ||
    user.roles?.includes("ADMIN") ||
    user.roles?.some((r) => r === "ADMIN" || r.name === "ADMIN");

  /* ==========================================
      SCHOOL
  ========================================== */

  let schoolId = filters.school_id || user.school_id;

  if (!isAdmin && !schoolId) {
    throw {
      status: 400,
      message: "School not assigned",
    };
  }

  /* ==========================================
      CURRENT ACADEMIC YEAR
  ========================================== */

  let academicYearId = filters.academic_year_id;

  if (!academicYearId) {
    let yearQuery = `
      SELECT id
      FROM academic_years
      WHERE is_current = 1
    `;

    const yearValues = [];

    if (!isAdmin) {
      yearQuery += ` AND school_id=?`;
      yearValues.push(schoolId);
    } else if (schoolId) {
      yearQuery += ` AND school_id=?`;
      yearValues.push(schoolId);
    }

    yearQuery += ` LIMIT 1`;

    const [[year]] = await db.query(yearQuery, yearValues);

    if (!year) {
      throw {
        status: 404,
        message: "Current academic year not found",
      };
    }

    academicYearId = year.id;
  }

  /* ==========================================
      CLASS SUMMARY
  ========================================== */

  let summaryQuery = `
      SELECT

          sa.class_id,

          c.name AS class_name,

          sa.section,

          COUNT(*) AS total_students

      FROM student_admissions sa

      INNER JOIN classes c
          ON c.id = sa.class_id

      WHERE
          sa.academic_year_id=?
          AND sa.status='active'
  `;

  const summaryValues = [academicYearId];

  if (!isAdmin) {
    summaryQuery += ` AND sa.school_id=?`;
    summaryValues.push(schoolId);
  } else if (schoolId) {
    summaryQuery += ` AND sa.school_id=?`;
    summaryValues.push(schoolId);
  }

  if (filters.class_id) {
    summaryQuery += ` AND sa.class_id=?`;
    summaryValues.push(filters.class_id);
  }

  if (filters.section) {
    summaryQuery += ` AND sa.section=?`;
    summaryValues.push(filters.section);
  }

  summaryQuery += `
      GROUP BY
          sa.class_id,
          c.name,
          sa.section

      ORDER BY

          CASE

              WHEN c.name='PRE KG' THEN 1
              WHEN c.name='NURSERY' THEN 2
              WHEN c.name='LKG' THEN 3
              WHEN c.name='UKG' THEN 4

              WHEN c.name='1' THEN 5
              WHEN c.name='2' THEN 6
              WHEN c.name='3' THEN 7
              WHEN c.name='4' THEN 8
              WHEN c.name='5' THEN 9
              WHEN c.name='6' THEN 10
              WHEN c.name='7' THEN 11
              WHEN c.name='8' THEN 12
              WHEN c.name='9' THEN 13
              WHEN c.name='10' THEN 14
              WHEN c.name='11' THEN 15
              WHEN c.name='12' THEN 16

              ELSE 999

          END,

          sa.section
  `;

  const [summary] = await db.query(summaryQuery, summaryValues);

  /* ==========================================
      STUDENT LIST
  ========================================== */

  let students = [];

  if (filters.include_students === "true") {
    let studentQuery = `
        SELECT

            sa.id AS admission_id,

            sa.admission_number,

            sa.roll_no,

            sa.joining_date,

            sa.status AS admission_status,

            sa.transport_required,

            sa.hostel_required,

            sa.subject_group,

            st.id AS student_id,

            st.first_name,

            st.last_name,

            st.gender,

            st.mobile_no,

            st.photo_url,

            c.id AS class_id,

            c.name AS class_name,

            sa.section,

            ay.id AS academic_year_id,

            ay.name AS academic_year

        FROM student_admissions sa

        INNER JOIN students st
            ON st.id = sa.student_id

        INNER JOIN classes c
            ON c.id = sa.class_id

        INNER JOIN academic_years ay
            ON ay.id = sa.academic_year_id

        WHERE

            sa.academic_year_id=?
            AND sa.status='active'
    `;

    const studentValues = [academicYearId];

    if (!isAdmin) {
      studentQuery += ` AND sa.school_id=?`;
      studentValues.push(schoolId);
    } else if (schoolId) {
      studentQuery += ` AND sa.school_id=?`;
      studentValues.push(schoolId);
    }

    if (filters.class_id) {
      studentQuery += ` AND sa.class_id=?`;
      studentValues.push(filters.class_id);
    }

    if (filters.section) {
      studentQuery += ` AND sa.section=?`;
      studentValues.push(filters.section);
    }

    studentQuery += `
        ORDER BY

            CASE

                WHEN c.name='PRE KG' THEN 1
                WHEN c.name='NURSERY' THEN 2
                WHEN c.name='LKG' THEN 3
                WHEN c.name='UKG' THEN 4

                WHEN c.name='1' THEN 5
                WHEN c.name='2' THEN 6
                WHEN c.name='3' THEN 7
                WHEN c.name='4' THEN 8
                WHEN c.name='5' THEN 9
                WHEN c.name='6' THEN 10
                WHEN c.name='7' THEN 11
                WHEN c.name='8' THEN 12
                WHEN c.name='9' THEN 13
                WHEN c.name='10' THEN 14
                WHEN c.name='11' THEN 15
                WHEN c.name='12' THEN 16

                ELSE 999

            END,

            sa.section,

            CAST(sa.roll_no AS UNSIGNED),

            st.first_name
    `;

    const [rows] = await db.query(studentQuery, studentValues);

    students = rows;
  }

  return {
    school_id: schoolId,
    academic_year_id: academicYearId,
    total_classes: summary.length,
    summary,
    students,
  };
};

export const getAdmissionById = async (id) => {
  try {
    const admission = await StudentAdmissionModel.findById(id);
    return admission;
  } catch (err) {
    throw err;
  }
};
