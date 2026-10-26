import { getDB } from "../../config/db.js";
import { StudentSectionAllocationModel } from "./studentSectionAllocation.model.js";
import {
  validateCreateSectionAllocation,
  validateUpdateSectionAllocation,
  validateBulkSectionAllocations,
} from "./studentSectionAllocation.validation.js";

/* ======================================================
   HELPER: GET USER WITH ROLES & SCHOOL RESTRICTION INFO
====================================================== */
export const getDbUserWithRoles = async (dbOrConn, userId) => {
  const [[dbUser]] = await dbOrConn.query(
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
    [userId],
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const roleList = dbUser.roles
    ? dbUser.roles.split(",").map((r) => r.trim().toUpperCase())
    : [];

  const isAdmin = roleList.includes("ADMIN") || roleList.includes("SUPERADMIN");

  return {
    ...dbUser,
    roleList,
    isAdmin,
  };
};

export const createSectionAllocation = async (data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSectionAllocation(data);

    await conn.beginTransaction();

    /* ======================================================
       1. VALIDATE ADMISSION ID / STUDENT ID PRESENCE
    ====================================================== */
    let admission = null;

    if (validated.admission_id) {
      const [[foundAdmission]] = await conn.query(
        `
        SELECT
            sa.*,
            s.id AS student_id,
            s.first_name,
            s.last_name,
            s.student_code
        FROM student_admissions sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.id = ?
        `,
        [validated.admission_id],
      );

      if (!foundAdmission) {
        throw {
          status: 404,
          message: `Student admission with ID ${validated.admission_id} not found`,
        };
      }
      admission = foundAdmission;
    } else if (validated.student_id) {
      // Find active admission for this student
      const [[foundAdmission]] = await conn.query(
        `
        SELECT
            sa.*,
            s.id AS student_id,
            s.first_name,
            s.last_name,
            s.student_code
        FROM student_admissions sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.student_id = ? AND sa.status = 'active'
        ORDER BY sa.id DESC
        LIMIT 1
        `,
        [validated.student_id],
      );

      if (!foundAdmission) {
        throw {
          status: 404,
          message: `No active admission found for student ID ${validated.student_id}`,
        };
      }
      admission = foundAdmission;
    }

    const targetAdmissionId = admission.id;

    /* ======================================================
       2. VALIDATE CLASS SECTION ID
    ====================================================== */
    const [[classSection]] = await conn.query(
      `
      SELECT
          cs.*,
          c.name AS class_name,
          sec.name AS section_name,
          ay.name AS academic_year_name
      FROM class_sections cs
      JOIN classes c ON cs.class_id = c.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      WHERE cs.id = ?
      `,
      [validated.class_section_id],
    );

    if (!classSection) {
      throw {
        status: 404,
        message: `Class section with ID ${validated.class_section_id} not found`,
      };
    }

    /* ======================================================
       3. VALIDATE REFERENTIAL & CROSS-ENTITY CONSISTENCY
    ====================================================== */
    if (classSection.school_id !== admission.school_id) {
      throw {
        status: 400,
        message: `Class section belongs to school ID ${classSection.school_id}, but student admission belongs to school ID ${admission.school_id}`,
      };
    }

    if (classSection.class_id !== admission.class_id) {
      throw {
        status: 400,
        message: `Class section class '${classSection.class_name}' (Class ID: ${classSection.class_id}) does not match student admission class (Class ID: ${admission.class_id})`,
      };
    }

    if (classSection.academic_year_id !== admission.academic_year_id) {
      throw {
        status: 400,
        message: `Class section academic year '${classSection.academic_year_name}' (Year ID: ${classSection.academic_year_id}) does not match student admission academic year (Year ID: ${admission.academic_year_id})`,
      };
    }

    /* ======================================================
       3b. ROLE & SCHOOL SCOPING CHECK (NON-ADMIN RESTRICTION)
    ====================================================== */
    if (user?.id) {
      const dbUser = await getDbUserWithRoles(conn, user.id);
      if (!dbUser.isAdmin) {
        if (!dbUser.school_id) {
          throw { status: 400, message: "User has no school assigned" };
        }
        if (
          Number(admission.school_id) !== Number(dbUser.school_id) ||
          Number(classSection.school_id) !== Number(dbUser.school_id)
        ) {
          throw {
            status: 403,
            message: "Forbidden: You can only allocate students within your assigned school",
          };
        }
      }
    }

    /* ======================================================
       4. AUTO-HANDLE EFFECTIVE_TO FOR PREVIOUS ACTIVE ALLOCATIONS
    ====================================================== */
    const newAllocationDate =
      validated.allocation_date || new Date().toISOString().split("T")[0];

    const [activeAllocations] = await conn.query(
      `
      SELECT *
      FROM student_section_allocations
      WHERE admission_id = ?
        AND status = 'active'
        AND (effective_to IS NULL OR effective_to >= ?)
      FOR UPDATE
      `,
      [targetAdmissionId, newAllocationDate],
    );

    // Prevent duplicate active allocation to the EXACT same section
    for (const active of activeAllocations) {
      if (Number(active.class_section_id) === Number(validated.class_section_id)) {
        throw {
          status: 409,
          message: `Student '${admission.first_name} ${admission.last_name}' is already actively allocated to section '${classSection.section_name}' in class '${classSection.class_name}'.`,
        };
      }
    }

    const closedAllocations = [];

    // Automatically close out previous active allocations by setting effective_to and status = 'transferred'
    for (const prev of activeAllocations) {
      const prevAllocDateStr =
        prev.allocation_date instanceof Date
          ? prev.allocation_date.toISOString().split("T")[0]
          : String(prev.allocation_date).slice(0, 10);

      // Must satisfy DB check constraint: (effective_to IS NULL OR effective_to >= allocation_date)
      const autoEffectiveTo =
        newAllocationDate >= prevAllocDateStr
          ? newAllocationDate
          : prevAllocDateStr;

      await conn.query(
        `
        UPDATE student_section_allocations
        SET effective_to = ?,
            status = 'transferred',
            remarks = COALESCE(CONCAT(COALESCE(remarks, ''), ' [Transferred to section ID ', ?, ' on ', ?, ']'), remarks),
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          autoEffectiveTo,
          validated.class_section_id,
          newAllocationDate,
          user?.id || null,
          prev.id,
        ],
      );

      closedAllocations.push({
        id: prev.id,
        previous_class_section_id: prev.class_section_id,
        auto_effective_to: autoEffectiveTo,
        previous_status: prev.status,
        new_status: "transferred",
      });
    }

    /* ======================================================
       5. INSERT NEW SECTION ALLOCATION
    ====================================================== */
    const newAllocationData = {
      admission_id: targetAdmissionId,
      class_section_id: validated.class_section_id,
      roll_no: validated.roll_no || null,
      allocation_date: newAllocationDate,
      effective_to: validated.effective_to || null,
      status: validated.status || "active",
      remarks:
        validated.remarks ||
        (closedAllocations.length > 0
          ? "Transferred from previous section"
          : "Initial section allocation"),
      created_by: user?.id || null,
      updated_by: user?.id || null,
    };

    const newAllocationId = await StudentSectionAllocationModel.create(
      conn,
      newAllocationData,
    );

    await conn.commit();

    const createdRecord = await StudentSectionAllocationModel.findById(
      newAllocationId,
    );

    return {
      message:
        closedAllocations.length > 0
          ? "Student successfully transferred to new section; previous section allocation closed with effective_to date."
          : "Student section allocated successfully.",
      data: createdRecord,
      closed_previous_allocations: closedAllocations,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSectionAllocation = async (id, data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "Valid allocation ID required" };
    }

    const validated = validateUpdateSectionAllocation(data);

    if (!Object.keys(validated).length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await conn.beginTransaction();

    const existing = await StudentSectionAllocationModel.findById(id);
    if (!existing) {
      throw {
        status: 404,
        message: `Section allocation with ID ${id} not found`,
      };
    }

    // Role & School access check for non-admin
    if (user?.id) {
      const dbUser = await getDbUserWithRoles(conn, user.id);
      if (!dbUser.isAdmin) {
        if (!dbUser.school_id || Number(existing.school_id) !== Number(dbUser.school_id)) {
          throw {
            status: 403,
            message: "Forbidden: You do not have permission to update allocations for another school",
          };
        }
      }
    }

    // If updating class_section_id, validate existence and consistency
    if (
      validated.class_section_id &&
      validated.class_section_id !== existing.class_section_id
    ) {
      const [[cs]] = await conn.query(
        `
        SELECT cs.*, c.name AS class_name, sec.name AS section_name
        FROM class_sections cs
        JOIN classes c ON cs.class_id = c.id
        JOIN sections sec ON cs.section_id = sec.id
        WHERE cs.id = ?
        `,
        [validated.class_section_id],
      );

      if (!cs) {
        throw {
          status: 404,
          message: `Class section with ID ${validated.class_section_id} not found`,
        };
      }

      if (cs.school_id !== existing.school_id) {
        throw {
          status: 400,
          message: "Class section and admission belong to different schools",
        };
      }

      if (cs.class_id !== existing.class_id) {
        throw {
          status: 400,
          message: `Class section class (${cs.class_name}) does not match admission class (ID: ${existing.class_id})`,
        };
      }

      if (cs.academic_year_id !== existing.academic_year_id) {
        throw {
          status: 400,
          message: "Class section academic year does not match admission academic year",
        };
      }
    }

    // Check date consistency for check constraint
    const currentAllocDate =
      validated.allocation_date ||
      (existing.allocation_date instanceof Date
        ? existing.allocation_date.toISOString().split("T")[0]
        : String(existing.allocation_date).slice(0, 10));

    const targetEffectiveTo =
      validated.effective_to !== undefined
        ? validated.effective_to
        : existing.effective_to instanceof Date
          ? existing.effective_to.toISOString().split("T")[0]
          : existing.effective_to;

    if (
      targetEffectiveTo &&
      currentAllocDate &&
      targetEffectiveTo < currentAllocDate
    ) {
      throw {
        status: 400,
        message: `effective_to (${targetEffectiveTo}) cannot be earlier than allocation_date (${currentAllocDate})`,
      };
    }

    const updatePayload = {
      ...validated,
      updated_by: user?.id || null,
    };

    await StudentSectionAllocationModel.update(conn, id, updatePayload);

    await conn.commit();

    const updated = await StudentSectionAllocationModel.findById(id);

    return {
      message: "Section allocation updated successfully",
      old_data: existing,
      data: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteSectionAllocation = async (id, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "Valid allocation ID required" };
    }

    await conn.beginTransaction();

    const existing = await StudentSectionAllocationModel.findById(id);
    if (!existing) {
      throw {
        status: 404,
        message: `Section allocation with ID ${id} not found`,
      };
    }

    // Role & School access check for non-admin
    if (user?.id) {
      const dbUser = await getDbUserWithRoles(conn, user.id);
      if (!dbUser.isAdmin) {
        if (!dbUser.school_id || Number(existing.school_id) !== Number(dbUser.school_id)) {
          throw {
            status: 403,
            message: "Forbidden: You do not have permission to delete allocations for another school",
          };
        }
      }
    }

    await StudentSectionAllocationModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Section allocation deleted successfully",
      old_data: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSectionAllocations = async (filters = {}, user = null) => {
  const queryFilters = { ...filters };

  if (user?.id) {
    const db = getDB();
    const dbUser = await getDbUserWithRoles(db, user.id);

    if (!dbUser.isAdmin) {
      if (!dbUser.school_id) {
        throw { status: 400, message: "User has no school assigned" };
      }
      queryFilters.school_id = dbUser.school_id;
    } else if (filters.school_id) {
      queryFilters.school_id = filters.school_id;
    }
  }

  return await StudentSectionAllocationModel.getAll(queryFilters);
};

export const getAllSectionAllocationsByToken = async (user, queryFilters = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  const dbUser = await getDbUserWithRoles(db, user.id);
  const filters = { ...queryFilters };

  if (!dbUser.isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    // Non-admin can only view section allocations within their own school
    filters.school_id = dbUser.school_id;
  } else if (queryFilters.school_id) {
    // Admin has access to all schools, or can filter by specific school
    filters.school_id = queryFilters.school_id;
  }

  return await StudentSectionAllocationModel.getAll(filters);
};

export const getSectionAllocationById = async (id, user = null) => {
  if (!id || isNaN(Number(id))) {
    throw { status: 400, message: "Valid allocation ID required" };
  }

  const record = await StudentSectionAllocationModel.findById(id);
  if (!record) {
    throw {
      status: 404,
      message: `Section allocation with ID ${id} not found`,
    };
  }

  if (user?.id) {
    const db = getDB();
    const dbUser = await getDbUserWithRoles(db, user.id);
    if (!dbUser.isAdmin) {
      if (!dbUser.school_id || Number(record.school_id) !== Number(dbUser.school_id)) {
        throw {
          status: 403,
          message: "Forbidden: You do not have permission to access allocations from another school",
        };
      }
    }
  }

  return record;
};

export const checkExistingSectionAllocation = async (data = {}) => {
  const db = getDB();

  const {
    admission_id,
    student_id,
    class_section_id,
    school_id,
    active_only = true,
  } = data;

  if (!admission_id && !student_id) {
    throw {
      status: 400,
      message: "admission_id or student_id is required to check allocation",
    };
  }

  let query = `
    SELECT
      ssa.*,
      sa.school_id,
      sa.admission_number,
      s.id AS student_id,
      s.student_code,
      s.first_name,
      s.last_name,
      c.id AS class_id,
      c.name AS class_name,
      sec.id AS section_id,
      sec.name AS section_name,
      ay.id AS academic_year_id,
      ay.name AS academic_year_name
    FROM student_section_allocations ssa
    INNER JOIN student_admissions sa ON ssa.admission_id = sa.id
    INNER JOIN students s ON sa.student_id = s.id
    INNER JOIN class_sections cs ON ssa.class_section_id = cs.id
    INNER JOIN classes c ON cs.class_id = c.id
    INNER JOIN sections sec ON cs.section_id = sec.id
    INNER JOIN academic_years ay ON cs.academic_year_id = ay.id
    WHERE 1 = 1
  `;

  const values = [];

  if (admission_id) {
    query += ` AND ssa.admission_id = ?`;
    values.push(admission_id);
  }

  if (student_id) {
    query += ` AND sa.student_id = ?`;
    values.push(student_id);
  }

  if (class_section_id) {
    query += ` AND ssa.class_section_id = ?`;
    values.push(class_section_id);
  }

  if (school_id) {
    query += ` AND sa.school_id = ?`;
    values.push(school_id);
  }

  if (active_only === "true" || active_only === true) {
    query += ` AND ssa.status = 'active' AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)`;
  }

  query += ` ORDER BY ssa.id DESC LIMIT 1`;

  const [[existing]] = await db.query(query, values);

  return {
    exists: !!existing,
    isAllocated: !!existing,
    allocation: existing || null,
    message: existing
      ? `Student '${existing.first_name} ${existing.last_name}' is currently allocated to section '${existing.section_name}' in class '${existing.class_name}'`
      : "No active allocation found",
  };
};

export const checkExistingSectionAllocationByToken = async (user, data = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  const dbUser = await getDbUserWithRoles(db, user.id);
  const payload = { ...data };

  if (!dbUser.isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    payload.school_id = dbUser.school_id;
  } else if (data.school_id) {
    payload.school_id = data.school_id;
  }

  return await checkExistingSectionAllocation(payload);
};


/* ======================================================
   BULK ALLOCATE STUDENTS TO SECTIONS
====================================================== */
export const bulkCreateSectionAllocations = async (data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateBulkSectionAllocations(data);

    await conn.beginTransaction();

    let userSchoolId = null;
    let isAdmin = false;
    if (user?.id) {
      const dbUser = await getDbUserWithRoles(conn, user.id);
      userSchoolId = dbUser.school_id;
      isAdmin = dbUser.isAdmin;
    }

    const results = [];
    let allocatedCount = 0;
    let transferredCount = 0;
    let updatedCount = 0;

    const csCache = new Map();

    for (const item of validated.allocations) {
      const [[admission]] = await conn.query(
        `
        SELECT sa.*, s.first_name, s.last_name, s.student_code
        FROM student_admissions sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.id = ?
        `,
        [item.admission_id],
      );

      if (!admission) {
        throw {
          status: 404,
          message: `Student admission with ID ${item.admission_id} not found`,
        };
      }

      if (!isAdmin && userSchoolId && Number(admission.school_id) !== Number(userSchoolId)) {
        throw {
          status: 403,
          message: `Forbidden: Admission #${item.admission_id} belongs to a different school`,
        };
      }

      let classSection = csCache.get(item.class_section_id);
      if (!classSection) {
        const [[cs]] = await conn.query(
          `
          SELECT cs.*, c.name AS class_name, sec.name AS section_name, ay.name AS academic_year_name
          FROM class_sections cs
          JOIN classes c ON cs.class_id = c.id
          JOIN sections sec ON cs.section_id = sec.id
          JOIN academic_years ay ON cs.academic_year_id = ay.id
          WHERE cs.id = ?
          `,
          [item.class_section_id],
        );

        if (!cs) {
          throw {
            status: 404,
            message: `Class section with ID ${item.class_section_id} not found`,
          };
        }
        classSection = cs;
        csCache.set(item.class_section_id, cs);
      }

      if (classSection.school_id !== admission.school_id) {
        throw {
          status: 400,
          message: `Class section belongs to school ID ${classSection.school_id}, but student admission #${admission.id} belongs to school ID ${admission.school_id}`,
        };
      }

      if (classSection.class_id !== admission.class_id) {
        throw {
          status: 400,
          message: `Class section class '${classSection.class_name}' does not match student admission #${admission.id} class`,
        };
      }

      if (classSection.academic_year_id !== admission.academic_year_id) {
        throw {
          status: 400,
          message: `Class section academic year '${classSection.academic_year_name}' does not match student admission #${admission.id} academic year`,
        };
      }

      const targetDate = item.allocation_date || new Date().toISOString().slice(0, 10);

      const [activeAllocations] = await conn.query(
        `
        SELECT *
        FROM student_section_allocations
        WHERE admission_id = ?
          AND status = 'active'
          AND (effective_to IS NULL OR effective_to >= ?)
        FOR UPDATE
        `,
        [item.admission_id, targetDate],
      );

      const alreadyInTarget = activeAllocations.find(
        (a) => Number(a.class_section_id) === Number(item.class_section_id)
      );

      if (alreadyInTarget) {
        const updateFields = {};
        if (item.roll_no !== undefined && item.roll_no !== alreadyInTarget.roll_no) {
          updateFields.roll_no = item.roll_no;
        }
        if (item.remarks !== undefined && item.remarks !== alreadyInTarget.remarks) {
          updateFields.remarks = item.remarks;
        }
        if (Object.keys(updateFields).length > 0) {
          updateFields.updated_by = user?.id || null;
          await StudentSectionAllocationModel.update(conn, alreadyInTarget.id, updateFields);
          updatedCount++;
        }
        results.push({
          id: alreadyInTarget.id,
          admission_id: item.admission_id,
          class_section_id: item.class_section_id,
          roll_no: item.roll_no !== undefined ? item.roll_no : alreadyInTarget.roll_no,
          action: "updated_roll_or_kept",
        });
      } else {
        let isTransfer = false;
        for (const prev of activeAllocations) {
          isTransfer = true;
          const prevAllocDateStr =
            prev.allocation_date instanceof Date
              ? prev.allocation_date.toISOString().split("T")[0]
              : String(prev.allocation_date).slice(0, 10);

          const autoEffectiveTo = targetDate >= prevAllocDateStr ? targetDate : prevAllocDateStr;

          await conn.query(
            `
            UPDATE student_section_allocations
            SET effective_to = ?,
                status = 'transferred',
                remarks = COALESCE(CONCAT(COALESCE(remarks, ''), ' [Transferred to section ID ', ?, ' on ', ?, ']'), remarks),
                updated_by = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [autoEffectiveTo, item.class_section_id, targetDate, user?.id || null, prev.id],
          );
        }

        const newAllocId = await StudentSectionAllocationModel.create(conn, {
          admission_id: item.admission_id,
          class_section_id: item.class_section_id,
          roll_no: item.roll_no || null,
          allocation_date: targetDate,
          effective_to: item.effective_to || null,
          status: item.status || "active",
          remarks: item.remarks || (isTransfer ? "Bulk transferred to section" : "Bulk section allocation"),
          created_by: user?.id || null,
          updated_by: user?.id || null,
        });

        if (isTransfer) {
          transferredCount++;
        } else {
          allocatedCount++;
        }

        results.push({
          id: newAllocId,
          admission_id: item.admission_id,
          class_section_id: item.class_section_id,
          roll_no: item.roll_no || null,
          action: isTransfer ? "transferred" : "allocated",
        });
      }
    }

    await conn.commit();

    return {
      message: `Bulk allocation completed: ${allocatedCount} newly allocated, ${transferredCount} transferred, ${updatedCount} updated.`,
      total: validated.allocations.length,
      allocated_count: allocatedCount,
      transferred_count: transferredCount,
      updated_count: updatedCount,
      data: results,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* ======================================================
   GET CLASS STUDENTS FOR SECTION ALLOCATION
====================================================== */
export const getClassStudentsForAllocation = async (filters, user) => {
  const db = getDB();
  const scopedFilters = { ...filters };

  if (user?.id) {
    const dbUser = await getDbUserWithRoles(db, user.id);
    if (!dbUser.isAdmin) {
      if (!dbUser.school_id) {
        throw { status: 400, message: "User has no school assigned" };
      }
      scopedFilters.school_id = dbUser.school_id;
    }
  }

  return await StudentSectionAllocationModel.getClassStudentsForAllocation(scopedFilters);
};
