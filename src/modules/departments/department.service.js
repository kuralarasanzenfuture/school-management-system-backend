import { getDB } from "../../config/db.js";
import { DepartmentModel } from "./department.model.js";
import {
  validateCreateDepartment,
  validateUpdateDepartment,
} from "./department.validation.js";

export const createDepartment = async (data) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateCreateDepartment(data);

    await connection.beginTransaction();

    // ✅ Check school exists
    const [[school]] = await connection.query(
      `SELECT id FROM schools WHERE id=?`,
      [validated.school_id],
    );

    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    // 🔴 Duplicate inside same school
    const duplicate = await DepartmentModel.findDuplicate(
      validated.school_id,
      validated.name,
    );

    if (duplicate) {
      throw {
        status: 409,
        message: "Department already exists in this school",
      };
    }

    const id = await DepartmentModel.create(connection, validated);

    await connection.commit();

    return {
      message: "Department created",
      id,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const updateDepartment = async (id, data) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateUpdateDepartment(data);

    await connection.beginTransaction();

    const dept = await DepartmentModel.findById(id);
    if (!dept) {
      throw { status: 404, message: "Department not found" };
    }

    // 🔴 duplicate check
    if (validated.name) {
      const duplicate = await DepartmentModel.findDuplicate(
        dept.school_id,
        validated.name,
        id,
      );

      if (duplicate) {
        throw {
          status: 409,
          message: "Department name already exists",
        };
      }
    }

    const fields = [];
    const values = [];

    if (validated.name !== undefined) {
      fields.push("name=?");
      values.push(validated.name);
    }

    if (validated.description !== undefined) {
      fields.push("description=?");
      values.push(validated.description);
    }

    if (validated.status !== undefined) {
      fields.push("status=?");
      values.push(validated.status);
    }

    if (fields.length) {
      await DepartmentModel.update(connection, id, fields, values);
    }

    await connection.commit();

    return { message: "Department updated" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getAllDepartments = async () => {
  return await DepartmentModel.getAll();
};

export const getAllDepartmentsByToken = async (user) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 Get fresh user + roles
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

  // 🔥 Normalize roles
  const roles = dbUser.roles ? dbUser.roles.split(",").filter(Boolean) : [];

  const isAdmin = roles.includes("ADMIN");

  let query = `
    SELECT *
    FROM departments
  `;

  const values = [];

  // 🔥 NON-ADMIN → filter by school
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    query += ` WHERE school_id = ?`;
    values.push(dbUser.school_id);
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getDepartmentsBySchool = async (school_id) => {
  return await DepartmentModel.getBySchool(school_id);
};

export const deleteDepartment = async (id) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const dept = await DepartmentModel.findById(id);
    if (!dept) {
      throw { status: 404, message: "Department not found" };
    }

    await DepartmentModel.delete(connection, id);

    await connection.commit();

    return { message: "Department deleted" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const checkExistingDepartment = async (data) => {
  const db = getDB();

  let { school_id, name } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name?.trim()) {
    throw { status: 400, message: "name is required" };
  }

  school_id = Number(school_id);
  name = name.trim();

  const [[existing]] = await db.query(
    `
    SELECT
      d.id,
      d.school_id,
      d.name,
      d.description
    FROM departments d
    WHERE d.school_id = ?
      AND UPPER(d.name) = UPPER(?)
    LIMIT 1
    `,
    [school_id, name],
  );

  return {
    available: !existing,
    exists: !!existing,
    department: existing || null,
  };
};
