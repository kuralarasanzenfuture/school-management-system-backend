import { getDB } from "../../config/db.js";
import { AcademicYearModel } from "./academicYear.model.js";
import {
  validateCreateAcademicYear,
  validateUpdateAcademicYear,
  validateAcademicYearFilters,
  generateAcademicYearName,
} from "./academicYear.validation.js";

export const createAcademicYear = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateAcademicYear(data);

    await conn.beginTransaction();

    // Check school exists
    const [[school]] = await conn.query(
      `SELECT id FROM schools WHERE id = ?`,
      [validated.school_id],
    );

    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    // Check duplicate name inside same school
    const duplicate = await AcademicYearModel.findDuplicate(
      validated.school_id,
      validated.name,
      null,
      conn,
    );

    if (duplicate) {
      throw {
        status: 409,
        message: `Academic year '${validated.name}' already exists in this school`,
      };
    }

    // Overlap check inside same school
    const overlap = await AcademicYearModel.checkOverlap(
      validated.school_id,
      validated.start_date,
      validated.end_date,
      null,
      conn,
    );

    if (overlap && overlap.length > 0) {
      throw {
        status: 400,
        message: `Academic year dates overlap with existing academic year '${overlap[0].name}' (${overlap[0].start_date} to ${overlap[0].end_date})`,
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await AcademicYearModel.create(conn, payload);
    const createdAcademicYear = await AcademicYearModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Academic year created",
      id,
      academicYear: createdAcademicYear,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateAcademicYear = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateAcademicYear(data);

    const existing = await AcademicYearModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Academic year not found" };
    }

    await conn.beginTransaction();

    const targetSchoolId = validated.school_id || existing.school_id;
    const newStart = validated.start_date || existing.start_date;
    const newEnd = validated.end_date || existing.end_date;

    // Check date logic if dates are modified
    if (validated.start_date || validated.end_date) {
      if (new Date(newStart) >= new Date(newEnd)) {
        throw { status: 400, message: "start_date must be before end_date" };
      }

      // Check overlap with other academic years
      const overlap = await AcademicYearModel.checkOverlap(
        targetSchoolId,
        newStart,
        newEnd,
        id,
        conn,
      );

      if (overlap && overlap.length > 0) {
        throw {
          status: 400,
          message: `Academic year dates overlap with existing academic year '${overlap[0].name}' (${overlap[0].start_date} to ${overlap[0].end_date})`,
        };
      }
    }

    // Check duplicate name if name or dates or school changed
    const targetName =
      validated.name ||
      (validated.start_date || validated.end_date
        ? generateAcademicYearName(newStart, newEnd)
        : existing.name);

    if (
      targetName !== existing.name ||
      targetSchoolId !== existing.school_id
    ) {
      const duplicate = await AcademicYearModel.findDuplicate(
        targetSchoolId,
        targetName,
        id,
        conn,
      );

      if (duplicate) {
        throw {
          status: 409,
          message: `Academic year '${targetName}' already exists in this school`,
        };
      }
    }

    const fields = [];
    const values = [];

    if (validated.school_id !== undefined) {
      fields.push("school_id = ?");
      values.push(validated.school_id);
    }

    if (validated.name !== undefined) {
      fields.push("name = ?");
      values.push(validated.name);
    } else if (validated.start_date || validated.end_date) {
      fields.push("name = ?");
      values.push(targetName);
    }

    if (validated.start_date !== undefined) {
      fields.push("start_date = ?");
      values.push(validated.start_date);
    }

    if (validated.end_date !== undefined) {
      fields.push("end_date = ?");
      values.push(validated.end_date);
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    if (validated.remarks !== undefined) {
      fields.push("remarks = ?");
      values.push(validated.remarks);
    }

    // Always update updated_by
    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await AcademicYearModel.update(conn, id, fields, values);

    const updatedAcademicYear = await AcademicYearModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Academic year updated",
      oldAcademicYear: existing,
      updatedAcademicYear,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateAcademicYearStatus = async (id, status, currentUser = null) => {
  if (!status) {
    throw { status: 400, message: "status is required" };
  }

  const normalized = String(status).toLowerCase().trim();
  if (!["active", "inactive", "archived"].includes(normalized)) {
    throw {
      status: 400,
      message: "Status must be 'active', 'inactive', or 'archived'",
    };
  }

  const existing = await AcademicYearModel.findById(id);
  if (!existing) {
    throw { status: 404, message: "Academic year not found" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await AcademicYearModel.update(
      conn,
      id,
      ["status = ?", "updated_by = ?"],
      [normalized, currentUser?.id || null],
    );

    const updatedAcademicYear = await AcademicYearModel.findById(id, conn);

    await conn.commit();

    return {
      message: `Academic year status updated to ${normalized}`,
      oldAcademicYear: existing,
      updatedAcademicYear,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAcademicYears = async (query = {}) => {
  const filters = validateAcademicYearFilters(query);
  return await AcademicYearModel.findAll(filters);
};

export const getAllAcademicYearsByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // Fetch fresh user + roles
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

  const filters = validateAcademicYearFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await AcademicYearModel.findAll(filters);
};

export const getAcademicYearsBySchool = async (school_id, query = {}) => {
  if (!school_id) {
    throw { status: 400, message: "school_id required" };
  }

  const filters = validateAcademicYearFilters({ ...query, school_id });
  return await AcademicYearModel.findAll(filters);
};

export const getAcademicYearById = async (id) => {
  const academicYear = await AcademicYearModel.findById(id);

  if (!academicYear) {
    throw { status: 404, message: "Academic year not found" };
  }

  return academicYear;
};

export const deleteAcademicYear = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await AcademicYearModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Academic year not found" };
    }

    // Safety checks against referencing records
    const refs = await AcademicYearModel.checkReferences(id, conn);

    if (refs.classSections > 0) {
      throw {
        status: 400,
        message: `Cannot delete academic year '${existing.name}'. It is currently referenced by ${refs.classSections} class section(s). Please remove or reassign associated records first.`,
      };
    }

    if (refs.students > 0) {
      throw {
        status: 400,
        message: `Cannot delete academic year '${existing.name}'. It is currently referenced by ${refs.students} student admission(s). Please remove or reassign associated student records first.`,
      };
    }

    await conn.beginTransaction();

    await AcademicYearModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Academic year deleted",
      deletedAcademicYear: existing,
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
          "Cannot delete this academic year because it is linked to existing records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingAcademicYear = async (data = {}) => {
  const db = getDB();

  let { school_id, name, id } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name?.trim()) {
    throw { status: 400, message: "name is required" };
  }

  school_id = Number(school_id);
  name = name.trim().toUpperCase();
  const excludeId = id || data.exclude_id || data.excludeId;

  let sql = `
    SELECT
      id,
      school_id,
      name,
      start_date,
      end_date,
      status,
      remarks,
      created_by,
      updated_by
    FROM academic_years
    WHERE school_id = ?
      AND UPPER(name) = UPPER(?)
  `;
  const params = [school_id, name];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    academicYear: existing || null,
  };
};

export const checkExistingAcademicYearByToken = async (user, data = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  let name = "";
  let excludeId = null;

  if (typeof data === "string") {
    name = data;
  } else if (data && typeof data === "object") {
    name = data.name || "";
    excludeId = data.id || data.exclude_id || data.excludeId || null;
  }

  if (!name?.trim()) {
    throw { status: 400, message: "Academic year name is required" };
  }

  // Get latest user + roles
  const [[dbUser]] = await db.query(
    `
    SELECT
      u.id,
      u.school_id,
      GROUP_CONCAT(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
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

  let schoolId = dbUser.school_id;

  if (isAdmin && (data?.school_id || user.school_id)) {
    schoolId = data?.school_id || user.school_id;
  }

  if (!schoolId) {
    throw { status: 400, message: "School not assigned" };
  }

  let sql = `
    SELECT
      id,
      school_id,
      name,
      start_date,
      end_date,
      status,
      remarks,
      created_by,
      updated_by
    FROM academic_years
    WHERE school_id = ?
      AND UPPER(name) = UPPER(?)
  `;
  const params = [Number(schoolId), name.trim()];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    academicYear: existing || null,
  };
};
