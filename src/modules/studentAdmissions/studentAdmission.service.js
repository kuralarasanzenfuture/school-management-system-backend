import { getDB } from "../../config/db.js";
import { StudentAdmissionModel } from "./studentAdmission.model.js";
import {
  validateCreateAdmission,
  validateUpdateAdmission,
} from "./studentAdmission.validation.js";

const generateAdmissionNumber = async (conn, school_id, yearName) => {
  const cleanYear = yearName ? String(yearName).replace(/[^a-zA-Z0-9-]/g, "") : "GEN";
  const [[row]] = await conn.query(
    `SELECT COUNT(*) as total FROM student_admissions WHERE school_id = ?`,
    [school_id],
  );

  let count = Number(row?.total || 0) + 1;
  let candidate = `ADM-${cleanYear}-${String(count).padStart(4, "0")}`;

  while (true) {
    const [[existing]] = await conn.query(
      `SELECT id FROM student_admissions WHERE school_id = ? AND admission_number = ? LIMIT 1`,
      [school_id, candidate],
    );
    if (!existing) break;
    count++;
    candidate = `ADM-${cleanYear}-${String(count).padStart(4, "0")}`;
  }

  return candidate;
};

export const createAdmission = async (data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateAdmission(data);

    await conn.beginTransaction();

    /* ======================================================
       1. VALIDATE STUDENT ID
    ====================================================== */
    const [[student]] = await conn.query(
      `
      SELECT
          id,
          school_id,
          first_name,
          last_name,
          student_code,
          status
      FROM students
      WHERE id = ?
      `,
      [validated.student_id],
    );

    if (!student) {
      throw {
        status: 404,
        message: `Student with ID ${validated.student_id} not found`,
      };
    }

    /* ======================================================
       2. VALIDATE ACADEMIC YEAR ID
    ====================================================== */
    const [[year]] = await conn.query(
      `
      SELECT
          id,
          school_id,
          name,
          status,
          start_date,
          end_date
      FROM academic_years
      WHERE id = ?
      `,
      [validated.academic_year_id],
    );

    if (!year) {
      throw {
        status: 404,
        message: `Academic year with ID ${validated.academic_year_id} not found`,
      };
    }

    if (year.school_id && year.school_id !== student.school_id) {
      throw {
        status: 400,
        message: "Academic year does not belong to the student's school",
      };
    }

    // Enforce admissions only for the current academic year
    const now = new Date();
    const isCurrentYear =
      (year.start_date && year.end_date && now >= new Date(year.start_date) && now <= new Date(year.end_date)) ||
      year.status === "active" ||
      String(year.name || "").includes(String(now.getFullYear()));

    if (!isCurrentYear) {
      throw {
        status: 400,
        message: `Admissions can only be created for the current academic year (${year.name} is not active/current)`,
      };
    }

    /* ======================================================
       3. VALIDATE CLASS ID
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
        message: `Class with ID ${validated.class_id} not found`,
      };
    }

    if (cls.school_id !== student.school_id) {
      throw {
        status: 400,
        message: `Class '${cls.name}' does not belong to the student's school`,
      };
    }

    /* ======================================================
       4. VALIDATE & RESOLVE SUBJECT GROUP (ID & NAME)
    ====================================================== */
    let finalSubjectGroupId = validated.subject_group_id || null;
    let finalSubjectGroupName = validated.subject_group || null;

    if (finalSubjectGroupId) {
      const [[subjectGroup]] = await conn.query(
        `
        SELECT id, school_id, name
        FROM subject_groups
        WHERE id = ?
        `,
        [finalSubjectGroupId],
      );

      if (!subjectGroup) {
        throw {
          status: 404,
          message: `Subject group with ID ${finalSubjectGroupId} not found`,
        };
      }

      if (subjectGroup.school_id && subjectGroup.school_id !== student.school_id) {
        throw {
          status: 400,
          message: `Subject group '${subjectGroup.name}' does not belong to the student's school`,
        };
      }

      // Automatically populate group name from group ID
      finalSubjectGroupName = subjectGroup.name;
    } else if (finalSubjectGroupName) {
      // Look up subject group by name in student's school
      const [[foundSg]] = await conn.query(
        `
        SELECT id, name
        FROM subject_groups
        WHERE school_id = ? AND name = ?
        LIMIT 1
        `,
        [student.school_id, finalSubjectGroupName],
      );

      if (foundSg) {
        finalSubjectGroupId = foundSg.id;
        finalSubjectGroupName = foundSg.name;
      }
    }

    /* ======================================================
       5. ENFORCE ONE ADMISSION PER STUDENT PER ACADEMIC YEAR
    ====================================================== */
    const [[existingAdmissionInYear]] = await conn.query(
      `
      SELECT
          sa.id,
          sa.admission_number,
          sa.status,
          ay.name AS academic_year_name
      FROM student_admissions sa
      JOIN academic_years ay ON sa.academic_year_id = ay.id
      WHERE sa.student_id = ?
        AND sa.academic_year_id = ?
      LIMIT 1
      `,
      [validated.student_id, validated.academic_year_id],
    );

    if (existingAdmissionInYear) {
      throw {
        status: 409,
        message: `Student '${student.first_name} ${student.last_name}' is already admitted for academic year '${existingAdmissionInYear.academic_year_name}' (Admission No: ${existingAdmissionInYear.admission_number}). Only one admission per student per academic year is permitted.`,
      };
    }

    /* ======================================================
       6. COMPLETE ANY ACTIVE ADMISSIONS FROM PREVIOUS ACADEMIC YEARS
    ====================================================== */
    const [previousActiveAdmissions] = await conn.query(
      `
      SELECT id, academic_year_id
      FROM student_admissions
      WHERE student_id = ?
        AND status = 'active'
      FOR UPDATE
      `,
      [validated.student_id],
    );

    for (const prev of previousActiveAdmissions) {
      await conn.query(
        `
        UPDATE student_admissions
        SET status = 'completed',
            updated_by = ?
        WHERE id = ?
        `,
        [user?.id || null, prev.id],
      );
    }

    /* ======================================================
       7. ADMISSION NUMBER (STRICTLY AUTO-GENERATED IN BACKEND)
    ====================================================== */
    const admission_number = await generateAdmissionNumber(
      conn,
      student.school_id,
      year.name,
    );

    /* ======================================================
       8. INSERT STUDENT ADMISSION
    ====================================================== */
    const admissionData = {
      school_id: student.school_id,
      student_id: validated.student_id,
      admission_number,
      admission_date: validated.admission_date || new Date().toISOString().split("T")[0],
      academic_year_id: year.id,
      class_id: cls.id,
      joining_date: validated.joining_date,
      subject_group_id: finalSubjectGroupId,
      subject_group: finalSubjectGroupName,
      transport_required: validated.transport_required ? 1 : 0,
      hostel_required: validated.hostel_required ? 1 : 0,
      admission_type: validated.admission_type,
      status: validated.status || "active",
      created_by: user?.id || null,
      updated_by: user?.id || null,
    };

    const admissionId = await StudentAdmissionModel.create(conn, admissionData);

    /* ======================================================
       9. OPTIONAL SECTION ALLOCATION DURING ADMISSION
    ====================================================== */
    let sectionAllocationInfo = null;

    let targetClassSectionId = validated.class_section_id;

    if (!targetClassSectionId && validated.section_id) {
      const [[foundCs]] = await conn.query(
        `SELECT id FROM class_sections WHERE school_id = ? AND class_id = ? AND section_id = ? AND academic_year_id = ? LIMIT 1`,
        [student.school_id, cls.id, validated.section_id, year.id],
      );
      if (foundCs) targetClassSectionId = foundCs.id;
    } else if (!targetClassSectionId && validated.section) {
      const [[foundCs]] = await conn.query(
        `
        SELECT cs.id
        FROM class_sections cs
        JOIN sections sec ON cs.section_id = sec.id
        WHERE cs.school_id = ? AND cs.class_id = ? AND cs.academic_year_id = ?
          AND sec.name = ?
        LIMIT 1
        `,
        [student.school_id, cls.id, year.id, validated.section],
      );
      if (foundCs) targetClassSectionId = foundCs.id;
    }

    if (targetClassSectionId) {
      // Validate class section exists and matches
      const [[cs]] = await conn.query(
        `
        SELECT cs.id, cs.school_id, cs.class_id, cs.section_id, cs.academic_year_id,
               sec.name AS section_name
        FROM class_sections cs
        JOIN sections sec ON cs.section_id = sec.id
        WHERE cs.id = ?
        `,
        [targetClassSectionId],
      );

      if (!cs) {
        throw {
          status: 404,
          message: `Class section with ID ${targetClassSectionId} not found`,
        };
      }

      if (cs.school_id !== student.school_id) {
        throw {
          status: 400,
          message: "Class section and student admission belong to different schools",
        };
      }

      if (cs.class_id !== cls.id) {
        throw {
          status: 400,
          message: "Class section does not belong to the admitted class",
        };
      }

      if (cs.academic_year_id !== year.id) {
        throw {
          status: 400,
          message: "Class section does not belong to the admitted academic year",
        };
      }

      const allocationDate =
        validated.allocation_date ||
        validated.admission_date ||
        new Date().toISOString().split("T")[0];

      const [allocResult] = await conn.query(
        `
        INSERT INTO student_section_allocations (
          admission_id,
          class_section_id,
          roll_no,
          allocation_date,
          effective_to,
          status,
          remarks,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, NULL, 'active', ?, ?, ?)
        `,
        [
          admissionId,
          targetClassSectionId,
          validated.roll_no || null,
          allocationDate,
          validated.remarks || "Initial section allocation on admission",
          user?.id || null,
          user?.id || null,
        ],
      );

      sectionAllocationInfo = {
        id: allocResult.insertId,
        class_section_id: targetClassSectionId,
        section_name: cs.section_name,
        roll_no: validated.roll_no || null,
        allocation_date: allocationDate,
        effective_to: null,
        status: "active",
      };
    }

    await conn.commit();

    return {
      message: "Student admitted successfully",
      data: {
        id: admissionId,
        ...admissionData,
        class_name: cls.name,
        academic_year: year.name,
        student_name: `${student.first_name} ${student.last_name}`.trim(),
        section_allocation: sectionAllocationInfo,
      },
    };
  } catch (err) {
    await conn.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      if (err.message && err.message.includes("uq_student_academic_year")) {
        throw {
          status: 409,
          message:
            "Student is already admitted for this academic year. Only one admission per student per academic year is permitted.",
        };
      }
      if (err.message && err.message.includes("uq_admission_number")) {
        throw {
          status: 409,
          message: "An admission with this admission number already exists in this school",
        };
      }
    }

    throw err;
  } finally {
    conn.release();
  }
};

export const updateAdmission = async (id, data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "Valid admission ID required" };
    }

    const validated = validateUpdateAdmission(data);

    if (!Object.keys(validated).length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await conn.beginTransaction();

    const existing = await StudentAdmissionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: `Admission with ID ${id} not found` };
    }

    // If changing academic year, check existence and uniqueness
    if (
      validated.academic_year_id &&
      validated.academic_year_id !== existing.academic_year_id
    ) {
      const [[newYear]] = await conn.query(
        `SELECT id, name, school_id FROM academic_years WHERE id = ?`,
        [validated.academic_year_id],
      );
      if (!newYear) {
        throw {
          status: 404,
          message: `Academic year with ID ${validated.academic_year_id} not found`,
        };
      }
      if (newYear.school_id && newYear.school_id !== existing.school_id) {
        throw {
          status: 400,
          message: "Academic year does not belong to the student's school",
        };
      }

      const [[dup]] = await conn.query(
        `SELECT id FROM student_admissions WHERE student_id = ? AND academic_year_id = ? AND id != ? LIMIT 1`,
        [existing.student_id, validated.academic_year_id, id],
      );
      if (dup) {
        throw {
          status: 409,
          message: `Student is already admitted for academic year '${newYear.name}'. Only one admission per student per academic year is permitted.`,
        };
      }
    }

    // If changing class, verify class existence
    if (validated.class_id && validated.class_id !== existing.class_id) {
      const [[newCls]] = await conn.query(
        `SELECT id, name, school_id FROM classes WHERE id = ?`,
        [validated.class_id],
      );
      if (!newCls) {
        throw {
          status: 404,
          message: `Class with ID ${validated.class_id} not found`,
        };
      }
      if (newCls.school_id !== existing.school_id) {
        throw {
          status: 400,
          message: `Class does not belong to the student's school`,
        };
      }
    }

    // If changing subject group by id or name
    if (
      validated.subject_group_id !== undefined ||
      validated.subject_group !== undefined
    ) {
      if (validated.subject_group_id) {
        const [[sg]] = await conn.query(
          `SELECT id, name, school_id FROM subject_groups WHERE id = ?`,
          [validated.subject_group_id],
        );
        if (!sg) {
          throw {
            status: 404,
            message: `Subject group with ID ${validated.subject_group_id} not found`,
          };
        }
        if (sg.school_id && sg.school_id !== existing.school_id) {
          throw {
            status: 400,
            message: `Subject group does not belong to the student's school`,
          };
        }
        validated.subject_group_id = sg.id;
        validated.subject_group = sg.name;
      } else if (validated.subject_group_id === null) {
        validated.subject_group_id = null;
        validated.subject_group = null;
      } else if (validated.subject_group) {
        const [[foundSg]] = await conn.query(
          `SELECT id, name FROM subject_groups WHERE school_id = ? AND name = ? LIMIT 1`,
          [existing.school_id, validated.subject_group],
        );
        if (foundSg) {
          validated.subject_group_id = foundSg.id;
          validated.subject_group = foundSg.name;
        }
      }
    }

    // Add updated_by
    const updatePayload = {
      ...validated,
      updated_by: user?.id || null,
    };

    await StudentAdmissionModel.update(conn, id, updatePayload);

    await conn.commit();

    const updated = await StudentAdmissionModel.findById(id);

    return {
      message: "Admission updated successfully",
      old_data: existing,
      data: updated,
    };
  } catch (err) {
    await conn.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      if (err.message && err.message.includes("uq_student_academic_year")) {
        throw {
          status: 409,
          message:
            "Student is already admitted for this academic year. Only one admission per student per academic year is permitted.",
        };
      }
      if (err.message && err.message.includes("uq_admission_number")) {
        throw {
          status: 409,
          message: "An admission with this admission number already exists in this school",
        };
      }
    }

    throw err;
  } finally {
    conn.release();
  }
};

export const deleteAdmission = async (id, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "Valid admission ID required" };
    }

    await conn.beginTransaction();

    const existing = await StudentAdmissionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: `Admission with ID ${id} not found` };
    }

    // Delete associated section allocations first to avoid FK RESTRICT error
    await conn.query(
      `DELETE FROM student_section_allocations WHERE admission_id = ?`,
      [id],
    );

    await StudentAdmissionModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Admission deleted successfully",
      old_data: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAdmissions = async (filters) => {
  return await StudentAdmissionModel.getAll(filters);
};

export const getAllAdmissionsByToken = async (user, queryFilters = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

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
  const filters = { ...queryFilters };

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw {
        status: 400,
        message: "User has no school assigned",
      };
    }
    // Non-admin can only view admissions within their own school
    filters.school_id = dbUser.school_id;
  } else if (queryFilters.school_id) {
    filters.school_id = queryFilters.school_id;
  }

  return await StudentAdmissionModel.getAll(filters);
};

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

  let schoolId = filters.school_id || user.school_id;

  if (!isAdmin && !schoolId) {
    throw {
      status: 400,
      message: "School not assigned",
    };
  }

  let academicYearId = filters.academic_year_id;

  if (!academicYearId) {
    let yearQuery = `SELECT id FROM academic_years WHERE status = 'active'`;
    const yearValues = [];

    if (schoolId) {
      yearQuery += ` AND school_id = ?`;
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
      CLASS & SECTION SUMMARY
  ========================================== */
  let summaryQuery = `
      SELECT
          sa.class_id,
          c.name AS class_name,
          COALESCE(sec.name, 'Unassigned') AS section,
          COUNT(DISTINCT sa.id) AS total_students
      FROM student_admissions sa
      INNER JOIN classes c ON c.id = sa.class_id
      INNER JOIN academic_years ay ON ay.id = sa.academic_year_id
      LEFT JOIN student_section_allocations ssa ON sa.id = ssa.admission_id
        AND ssa.status = 'active'
        AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)
      LEFT JOIN class_sections cs ON ssa.class_section_id = cs.id
      LEFT JOIN sections sec ON cs.section_id = sec.id
      WHERE (ay.name = ? OR sa.academic_year_id = ? OR ay.name = (SELECT name FROM academic_years WHERE id = ?))
        AND sa.status = 'active'
  `;

  const summaryValues = [academicYearId, academicYearId, academicYearId];

  if (schoolId) {
    summaryQuery += ` AND sa.school_id = ?`;
    summaryValues.push(schoolId);
  }

  if (filters.class_id) {
    summaryQuery += ` AND (sa.class_id = ? OR c.name = ?)`;
    summaryValues.push(filters.class_id, filters.class_id);
  }

  if (filters.section) {
    summaryQuery += ` AND (sec.name = ? OR cs.section_id = ?)`;
    summaryValues.push(filters.section, filters.section);
  }

  summaryQuery += `
      GROUP BY sa.class_id, c.name, sec.name
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
          sec.name
  `;

  const [summary] = await db.query(summaryQuery, summaryValues);

  /* ==========================================
      STUDENT LIST
  ========================================== */
  let students = [];

  const includeStudents =
    filters.include_students === true ||
    filters.include_students === "true" ||
    filters.include_students === 1 ||
    filters.include_students === "1";

  if (includeStudents) {
    let studentQuery = `
        SELECT
            sa.id AS admission_id,
            sa.admission_number,
            ssa.roll_no,
            sa.joining_date,
            sa.status AS admission_status,
            sa.transport_required,
            sa.hostel_required,
            sg.name AS subject_group,

            st.id AS student_id,
            st.student_code,
            st.first_name,
            st.last_name,
            st.gender,
            st.mobile_no,
            st.photo_url,

            c.id AS class_id,
            c.name AS class_name,
            sec.name AS section,

            ay.id AS academic_year_id,
            ay.name AS academic_year
        FROM student_admissions sa
        INNER JOIN students st ON st.id = sa.student_id
        INNER JOIN classes c ON c.id = sa.class_id
        INNER JOIN academic_years ay ON ay.id = sa.academic_year_id
        LEFT JOIN subject_groups sg ON sa.subject_group_id = sg.id
        LEFT JOIN student_section_allocations ssa ON sa.id = ssa.admission_id
          AND ssa.status = 'active'
          AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)
        LEFT JOIN class_sections cs ON ssa.class_section_id = cs.id
        LEFT JOIN sections sec ON cs.section_id = sec.id
        WHERE (ay.name = ? OR sa.academic_year_id = ? OR ay.name = (SELECT name FROM academic_years WHERE id = ?))
          AND sa.status = 'active'
    `;

    const studentValues = [academicYearId, academicYearId, academicYearId];

    if (schoolId) {
      studentQuery += ` AND sa.school_id = ?`;
      studentValues.push(schoolId);
    }

    if (filters.class_id) {
      studentQuery += ` AND (sa.class_id = ? OR c.name = ?)`;
      studentValues.push(filters.class_id, filters.class_id);
    }

    if (filters.section) {
      studentQuery += ` AND (sec.name = ? OR cs.section_id = ?)`;
      studentValues.push(filters.section, filters.section);
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
            sec.name,
            CAST(ssa.roll_no AS UNSIGNED),
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

export const getAdmissionsReport = async (user, filters = {}) => {
  const db = getDB();

  const selectFields = `
      sa.id,
      sa.school_id,
      sa.student_id,
      sa.admission_number,
      sa.admission_date,
      sa.joining_date,
      sa.academic_year_id,
      ay.name AS academic_year,
      ay.name AS academic_year_name,
      sa.class_id,
      c.name AS class_name,
      sec.name AS section,
      sec.name AS section_name,
      ssa.roll_no,
      sa.status,
      sa.admission_type,
      sa.transport_required,
      sa.hostel_required,
      COALESCE(sg.name, sa.subject_group) AS subject_group,
      sch.name AS school_name,

      s.student_code,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.mobile_no,
      s.parent_mobile,
      s.alternate_mobile,
      s.father_name,
      s.mother_name,
      s.email,
      s.permanent_city,
      s.permanent_state,
      s.gender,
      s.date_of_birth,
      s.photo_url
  `;

  const fromClause = `
    FROM student_admissions sa
    JOIN students s ON sa.student_id = s.id
    LEFT JOIN schools sch ON sa.school_id = sch.id
    JOIN classes c ON sa.class_id = c.id
    JOIN academic_years ay ON sa.academic_year_id = ay.id
    LEFT JOIN subject_groups sg ON sa.subject_group_id = sg.id
    LEFT JOIN student_section_allocations ssa ON sa.id = ssa.admission_id
      AND ssa.status = 'active'
      AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)
    LEFT JOIN class_sections cs ON ssa.class_section_id = cs.id
    LEFT JOIN sections sec ON cs.section_id = sec.id
  `;

  let whereClause = ` WHERE 1=1`;
  const values = [];

  const isAdmin =
    user.role === 'ADMIN' ||
    user.roles?.includes('ADMIN') ||
    user.roles?.some((r) => r === 'ADMIN' || r.name === 'ADMIN');

  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 403, message: 'No school access' };
    }
    whereClause += ` AND sa.school_id = ?`;
    values.push(user.school_id);
  } else if (filters.school_id) {
    whereClause += ` AND sa.school_id = ?`;
    values.push(filters.school_id);
  }

  // Academic Year filter: handles year name or year ID across all schools or single school
  const targetYear = filters.academic_year_name || filters.academic_year || filters.academic_year_id;
  if (targetYear) {
    whereClause += ` AND (
      ay.name = ?
      OR sa.academic_year_id = ?
      OR ay.name = (SELECT name FROM academic_years WHERE id = ? LIMIT 1)
    )`;
    values.push(targetYear, targetYear, targetYear);
  }

  // Class filter: handles class name or class ID across all schools or single school
  const targetClass = filters.class_name || filters.class || filters.class_id;
  if (targetClass) {
    whereClause += ` AND (
      sa.class_id = ?
      OR c.name = ?
      OR c.name = (SELECT name FROM classes WHERE id = ? LIMIT 1)
    )`;
    values.push(targetClass, targetClass, targetClass);
  }

  // Section filter
  if (filters.section) {
    whereClause += ` AND (sec.name = ? OR sec.id = ?)`;
    values.push(filters.section, filters.section);
  }

  // Admission type
  if (filters.admission_type) {
    whereClause += ` AND LOWER(sa.admission_type) = ?`;
    values.push(filters.admission_type.toLowerCase());
  }

  // Status
  if (filters.status && filters.status !== 'all') {
    whereClause += ` AND LOWER(sa.status) = ?`;
    values.push(filters.status.toLowerCase());
  }

  // Dates
  if (filters.from_date && filters.to_date) {
    whereClause += ` AND sa.admission_date BETWEEN ? AND ?`;
    values.push(filters.from_date, filters.to_date);
  } else if (filters.from_date) {
    whereClause += ` AND sa.admission_date >= ?`;
    values.push(filters.from_date);
  } else if (filters.to_date) {
    whereClause += ` AND sa.admission_date <= ?`;
    values.push(filters.to_date);
  }

  // High-performance SQL aggregates for stats cards directly from database
  const statsQuery = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN LOWER(sa.status) IN ('active', 'completed') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN LOWER(sa.status) = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN LOWER(sa.status) IN ('inactive', 'dropped', 'cancelled') THEN 1 ELSE 0 END) AS inactive,
      SUM(CASE WHEN sa.transport_required = 1 OR sa.transport_required = '1' OR LOWER(sa.transport_required) = 'true' THEN 1 ELSE 0 END) AS transport,
      SUM(CASE WHEN sa.hostel_required = 1 OR sa.hostel_required = '1' OR LOWER(sa.hostel_required) = 'true' THEN 1 ELSE 0 END) AS hostel,
      SUM(CASE WHEN LOWER(s.gender) IN ('male', 'm') THEN 1 ELSE 0 END) AS male,
      SUM(CASE WHEN LOWER(s.gender) IN ('female', 'f') THEN 1 ELSE 0 END) AS female,
      SUM(CASE WHEN LOWER(s.gender) NOT IN ('male', 'm', 'female', 'f') AND s.gender IS NOT NULL AND s.gender != '' THEN 1 ELSE 0 END) AS other_gender
    ${fromClause}
    ${whereClause}
  `;

  const dataQuery = `SELECT ${selectFields} ${fromClause} ${whereClause} ORDER BY sa.id DESC`;

  const [rows] = await db.query(dataQuery, values);
  const [[statsRow]] = await db.query(statsQuery, values);

  const stats = {
    total: Number(statsRow?.total || 0),
    active: Number(statsRow?.active || 0),
    pending: Number(statsRow?.pending || 0),
    inactive: Number(statsRow?.inactive || 0),
    transport: Number(statsRow?.transport || 0),
    hostel: Number(statsRow?.hostel || 0),
    male: Number(statsRow?.male || 0),
    female: Number(statsRow?.female || 0),
    other: Number(statsRow?.other_gender || 0),
  };

  return {
    stats,
    admissions: rows,
  };
};

export const getAdmissionById = async (id) => {
  if (!id || isNaN(Number(id))) {
    throw { status: 400, message: "Valid admission ID required" };
  }
  const admission = await StudentAdmissionModel.findById(id);
  if (!admission) {
    throw { status: 404, message: `Admission with ID ${id} not found` };
  }
  return admission;
};
