import { getDB } from "../../config/db.js";
import { ClassSectionModel } from "./class_section.model.js";
import {
  validateCreateClassSection,
  validateUpdateClassSection,
  validateClassSectionFilters,
} from "./class_section.validation.js";

export const createClassSection = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateClassSection(data);

    await conn.beginTransaction();

    // Check school exists
    const [[school]] = await conn.query(
      `SELECT id FROM schools WHERE id = ?`,
      [validated.school_id],
    );
    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    // Check class exists and belongs to school
    const [[cls]] = await conn.query(
      `SELECT id, school_id, name FROM classes WHERE id = ?`,
      [validated.class_id],
    );
    if (!cls) {
      throw { status: 404, message: "Class not found" };
    }
    if (cls.school_id !== validated.school_id) {
      throw {
        status: 400,
        message: "Class does not belong to the selected school",
      };
    }

    // Check section exists and belongs to class
    const [[sec]] = await conn.query(
      `SELECT id, class_id, name FROM sections WHERE id = ?`,
      [validated.section_id],
    );
    if (!sec) {
      throw { status: 404, message: "Section not found" };
    }
    if (sec.class_id !== validated.class_id) {
      throw {
        status: 400,
        message: "Section does not belong to the selected class",
      };
    }

    // Check academic year exists
    const [[ay]] = await conn.query(
      `SELECT id, school_id FROM academic_years WHERE id = ?`,
      [validated.academic_year_id],
    );
    if (!ay) {
      throw { status: 404, message: "Academic year not found" };
    }

    const exists = await ClassSectionModel.findDuplicate(conn, validated);
    if (exists) {
      throw {
        status: 409,
        message: "Class section mapping already exists for this academic year",
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await ClassSectionModel.create(conn, payload);
    const createdClassSection = await ClassSectionModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Class section created",
      id,
      classSection: createdClassSection,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateClassSection = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateClassSection(data);

    const existing = await ClassSectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Class section not found" };
    }

    await conn.beginTransaction();

    const targetSchoolId = validated.school_id || existing.school_id;
    const targetClassId = validated.class_id || existing.class_id;
    const targetSectionId = validated.section_id || existing.section_id;
    const targetAcademicYearId =
      validated.academic_year_id || existing.academic_year_id;

    // Duplicate check if any mapping key changed
    if (
      validated.school_id ||
      validated.class_id ||
      validated.section_id ||
      validated.academic_year_id
    ) {
      const duplicate = await ClassSectionModel.findDuplicate(
        conn,
        {
          school_id: targetSchoolId,
          class_id: targetClassId,
          section_id: targetSectionId,
          academic_year_id: targetAcademicYearId,
        },
        id,
      );

      if (duplicate) {
        throw {
          status: 409,
          message:
            "Class section mapping already exists for this academic year",
        };
      }
    }

    const fields = [];
    const values = [];

    if (validated.school_id !== undefined) {
      fields.push("school_id = ?");
      values.push(validated.school_id);
    }

    if (validated.class_id !== undefined) {
      fields.push("class_id = ?");
      values.push(validated.class_id);
    }

    if (validated.section_id !== undefined) {
      fields.push("section_id = ?");
      values.push(validated.section_id);
    }

    if (validated.academic_year_id !== undefined) {
      fields.push("academic_year_id = ?");
      values.push(validated.academic_year_id);
    }

    if (validated.class_teacher_id !== undefined) {
      fields.push("class_teacher_id = ?");
      values.push(validated.class_teacher_id);
    }

    if (validated.capacity !== undefined) {
      fields.push("capacity = ?");
      values.push(validated.capacity);
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    // Always update updated_by
    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await ClassSectionModel.update(conn, id, fields, values);

    const updatedClassSection = await ClassSectionModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Class section updated",
      oldClassSection: existing,
      updatedClassSection,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateClassSectionStatus = async (
  id,
  status,
  currentUser = null,
) => {
  if (!status) {
    throw { status: 400, message: "status is required" };
  }

  const normalized = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(normalized)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }

  const existing = await ClassSectionModel.findById(id);
  if (!existing) {
    throw { status: 404, message: "Class section not found" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await ClassSectionModel.update(
      conn,
      id,
      ["status = ?", "updated_by = ?"],
      [normalized, currentUser?.id || null],
    );

    const updatedClassSection = await ClassSectionModel.findById(id, conn);

    await conn.commit();

    return {
      message: `Class section status updated to ${normalized}`,
      oldClassSection: existing,
      updatedClassSection,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClassSections = async (query = {}) => {
  const filters = validateClassSectionFilters(query);
  return await ClassSectionModel.findAll(filters);
};

export const getAllClassSectionsByToken = async (user, query = {}) => {
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

  const roles = dbUser.roles ? dbUser.roles.split(",").filter(Boolean) : [];
  const isAdmin = roles.includes("ADMIN");

  const filters = validateClassSectionFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await ClassSectionModel.findAll(filters);
};

export const getClassSectionById = async (id) => {
  if (!id) {
    throw { status: 400, message: "ID is required" };
  }

  const classSection = await ClassSectionModel.findById(id);

  if (!classSection) {
    throw { status: 404, message: "Class section not found" };
  }

  return classSection;
};

export const deleteClassSection = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await ClassSectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Class section not found" };
    }

    // Safety checks against referencing records
    const refs = await ClassSectionModel.checkReferences(id, conn);

    if (refs.classSubjects > 0) {
      throw {
        status: 400,
        message: `Cannot delete class section mapping. It is currently referenced by ${refs.classSubjects} class subject(s). Please remove or reassign associated subjects first.`,
      };
    }

    if (refs.attendanceSessions > 0) {
      throw {
        status: 400,
        message: `Cannot delete class section mapping. It is currently referenced by ${refs.attendanceSessions} student attendance session(s). Please remove or reassign associated attendance records first.`,
      };
    }

    await conn.beginTransaction();

    await ClassSectionModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Class section deleted",
      deletedClassSection: existing,
    };
  } catch (err) {
    await conn.rollback();
    if (
      err.code === "ER_ROW_IS_REFERENCED_2" ||
      err.errno === 1451 ||
      (err.message && err.message.includes("foreign key constraint fails"))
    ) {
      throw {
        status: 400,
        message:
          "Cannot delete this class section because it is linked to existing records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingClassSection = async (data = {}) => {
  const db = getDB();
  const { school_id, class_id, section_id, academic_year_id, id } = data;

  if (!school_id) throw { status: 400, message: "school_id is required" };
  if (!class_id) throw { status: 400, message: "class_id is required" };
  if (!section_id) throw { status: 400, message: "section_id is required" };
  if (!academic_year_id)
    throw { status: 400, message: "academic_year_id is required" };

  const excludeId = id || data.exclude_id || data.excludeId;

  let sql = `
    SELECT id, school_id, class_id, section_id, academic_year_id, status
    FROM class_sections
    WHERE school_id = ? AND class_id = ? AND section_id = ? AND academic_year_id = ?
  `;
  const params = [
    Number(school_id),
    Number(class_id),
    Number(section_id),
    Number(academic_year_id),
  ];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    classSection: existing || null,
  };
};

export const checkExistingClassSectionByToken = async (user, data = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  const { class_id, section_id, academic_year_id } = data;

  if (!class_id) throw { status: 400, message: "class_id is required" };
  if (!section_id) throw { status: 400, message: "section_id is required" };
  if (!academic_year_id)
    throw { status: 400, message: "academic_year_id is required" };

  // Get user + school
  const [[dbUser]] = await db.query(
    `SELECT id, school_id FROM users WHERE id = ?`,
    [user.id],
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const schoolId = data.school_id || dbUser.school_id;
  if (!schoolId) {
    throw { status: 400, message: "School not assigned" };
  }

  return await checkExistingClassSection({
    ...data,
    school_id: schoolId,
  });
};
