import { getDB } from "../../config/db.js";
import { ClassModel } from "./class.model.js";
import {
  validateCreateClass,
  validateUpdateClass,
  validateClassFilters,
} from "./class.validation.js";

export const createClass = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateClass(data);

    await conn.beginTransaction();

    // Check school exists
    const [[school]] = await conn.query(
      `SELECT id FROM schools WHERE id = ?`,
      [validated.school_id],
    );

    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    // Duplicate check inside same school
    const exists = await ClassModel.findDuplicate(
      validated.school_id,
      validated.name,
      null,
      conn,
    );

    if (exists) {
      throw {
        status: 409,
        message: `Class '${validated.name}' already exists in this school`,
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await ClassModel.create(conn, payload);
    const createdClass = await ClassModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Class created",
      id,
      class: createdClass,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateClass = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateClass(data);

    const existing = await ClassModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Class not found" };
    }

    await conn.beginTransaction();

    const targetSchoolId = validated.school_id || existing.school_id;

    // Duplicate check if name or school_id changed
    if (validated.name || validated.school_id) {
      const checkName = validated.name || existing.name;
      const dup = await ClassModel.findDuplicate(
        targetSchoolId,
        checkName,
        id,
        conn,
      );

      if (dup) {
        throw {
          status: 409,
          message: `Class '${checkName}' already exists in this school`,
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
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    // Always update updated_by
    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await ClassModel.update(conn, id, fields, values);

    const updatedClass = await ClassModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Class updated",
      oldClass: existing,
      updatedClass,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateClassStatus = async (id, status, currentUser = null) => {
  if (!status) {
    throw { status: 400, message: "status is required" };
  }

  const normalized = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(normalized)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }

  const existing = await ClassModel.findById(id);
  if (!existing) {
    throw { status: 404, message: "Class not found" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await ClassModel.update(
      conn,
      id,
      ["status = ?", "updated_by = ?"],
      [normalized, currentUser?.id || null],
    );

    const updatedClass = await ClassModel.findById(id, conn);

    await conn.commit();

    return {
      message: `Class status updated to ${normalized}`,
      oldClass: existing,
      updatedClass,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClasses = async (query = {}) => {
  const filters = validateClassFilters(query);
  return await ClassModel.findAll(filters);
};

export const getAllClassesByToken = async (user, query = {}) => {
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

  const filters = validateClassFilters(query);

  // Non-admin users only see their school's classes
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await ClassModel.findAll(filters);
};

export const getAllClassesSchoolId = async (school_id, query = {}) => {
  if (!school_id) {
    throw { status: 400, message: "school_id required" };
  }

  const filters = validateClassFilters({ ...query, school_id });
  return await ClassModel.findAll(filters);
};

export const getClassById = async (id) => {
  const cls = await ClassModel.findById(id);

  if (!cls) {
    throw { status: 404, message: "Class not found" };
  }

  return cls;
};

export const deleteClass = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await ClassModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Class not found" };
    }

    // Reference checks before deletion
    const refs = await ClassModel.checkReferences(id, conn);

    if (refs.sections > 0) {
      throw {
        status: 400,
        message: `Cannot delete class '${existing.name}'. It is currently referenced by ${refs.sections} section(s). Please remove or reassign associated sections first.`,
      };
    }

    if (refs.students > 0) {
      throw {
        status: 400,
        message: `Cannot delete class '${existing.name}'. It is currently referenced by ${refs.students} student admission(s). Please remove or reassign associated student admissions first.`,
      };
    }

    if (refs.classSections > 0) {
      throw {
        status: 400,
        message: `Cannot delete class '${existing.name}'. It is currently referenced by ${refs.classSections} class section(s). Please remove or reassign associated class sections first.`,
      };
    }

    await conn.beginTransaction();

    await ClassModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Class deleted",
      deletedClass: existing,
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
          "Cannot delete this class because it is linked to existing records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingClass = async (data = {}) => {
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
      status,
      created_by,
      updated_by
    FROM classes
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
    class: existing || null,
  };
};

export const checkExistingClassByToken = async (user, data = {}) => {
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
    throw { status: 400, message: "Class name is required" };
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

  // Allow admin to specify school_id
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
      status,
      created_by,
      updated_by
    FROM classes
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
    class: existing || null,
  };
};
