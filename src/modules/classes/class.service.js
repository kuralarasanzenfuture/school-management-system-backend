import { getDB } from "../../config/db.js";
import { ClassModel } from "./class.model.js";
import {
  validateCreateClass,
  validateUpdateClass,
} from "./class.validation.js";

export const createClass = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateClass(data);

    // ❌ duplicate check
    const exists = await ClassModel.findDuplicate(
      validated.school_id,
      validated.name,
    );

    if (exists) {
      throw { status: 409, message: "Class already exists" };
    }

    await conn.beginTransaction();

    const id = await ClassModel.create(conn, validated);

    await conn.commit();

    return {
      message: "Class created",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateClass = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateClass(data);

    const existing = await ClassModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Class not found" };
    }

    // ❌ duplicate check
    if (validated.name) {
      const dup = await ClassModel.findDuplicate(
        existing.school_id,
        validated.name,
        id,
      );

      if (dup) {
        throw { status: 409, message: "Class already exists" };
      }
    }

    const fields = [];
    const values = [];

    if (validated.name) {
      fields.push("name=?");
      values.push(validated.name);
    }

    if (validated.status) {
      fields.push("status=?");
      values.push(validated.status);
    }

    if (!fields.length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await conn.beginTransaction();

    await ClassModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Class updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClassesSchoolId = async (school_id) => {
  if (!school_id) {
    throw { status: 400, message: "school_id required" };
  }

  return await ClassModel.getAllBySchool(school_id);
};

export const getAllClasses = async () => {
  return await ClassModel.getAll();
};

export const getAllClassesByToken = async (user) => {
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
    [user.id]
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const roles = dbUser.roles ? dbUser.roles.split(",").filter(Boolean) : [];

  const isAdmin = roles.includes("ADMIN");

  let query = `
    SELECT
      c.*,
      s.name AS school_name
    FROM classes c
    LEFT JOIN schools s
      ON c.school_id = s.id
  `;

  const values = [];

  // Non-admin users only see their school's classes
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    query += ` WHERE c.school_id = ?`;
    values.push(dbUser.school_id);
  }

  query += ` ORDER BY c.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
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

    await conn.beginTransaction();

    await ClassModel.delete(conn, id);

    await conn.commit();

    return { message: "Class deleted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingClass = async ({ school_id, name }) => {
  const db = getDB();

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name) {
    throw { status: 400, message: "name is required" };
  }

  const [[existing]] = await db.query(
    `
    SELECT
      id,
      school_id,
      name,
      status
    FROM classes
    WHERE school_id = ?
      AND UPPER(name) = UPPER(?)
    LIMIT 1
    `,
    [Number(school_id), name.trim()],
  );

  return {
    available: !existing,
    exists: !!existing,
    class: existing || null,
  };
};

export const checkExistingClassByToken = async (user, name) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
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

  // Optional: allow admin to specify school_id
  if (isAdmin && user.school_id) {
    schoolId = user.school_id;
  }

  if (!schoolId) {
    throw { status: 400, message: "School not assigned" };
  }

  const [[existing]] = await db.query(
    `
    SELECT
      id,
      school_id,
      name,
      status
    FROM classes
    WHERE school_id = ?
      AND UPPER(name) = UPPER(?)
    LIMIT 1
    `,
    [schoolId, name.trim()],
  );

  return {
    available: !existing,
    exists: !!existing,
    class: existing || null,
  };
};
