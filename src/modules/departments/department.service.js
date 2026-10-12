import { getDB } from "../../config/db.js";
import { DepartmentModel } from "./department.model.js";
import {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateDepartmentFilters,
} from "./department.validation.js";

export const createDepartment = async (data, currentUser = null) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateCreateDepartment(data);

    await connection.beginTransaction();

    // Check school exists
    const [[school]] = await connection.query(
      `SELECT id FROM schools WHERE id = ?`,
      [validated.school_id],
    );

    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    // Check duplicate inside same school
    const duplicate = await DepartmentModel.findDuplicate(
      validated.school_id,
      validated.name,
      null,
      connection,
    );

    if (duplicate) {
      throw {
        status: 409,
        message: `Department '${validated.name}' already exists in this school`,
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await DepartmentModel.create(connection, payload);
    const createdDepartment = await DepartmentModel.findById(id, connection);

    await connection.commit();

    return {
      message: "Department created",
      id,
      department: createdDepartment,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const updateDepartment = async (id, data, currentUser = null) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateUpdateDepartment(data);

    const oldDepartment = await DepartmentModel.findById(id);
    if (!oldDepartment) {
      throw { status: 404, message: "Department not found" };
    }

    await connection.beginTransaction();

    const targetSchoolId = validated.school_id || oldDepartment.school_id;

    // Duplicate check if name or school_id changed
    if (validated.name || validated.school_id) {
      const checkName = validated.name || oldDepartment.name;
      const duplicate = await DepartmentModel.findDuplicate(
        targetSchoolId,
        checkName,
        id,
        connection,
      );

      if (duplicate) {
        throw {
          status: 409,
          message: `Department '${checkName}' already exists in this school`,
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

    if (validated.description !== undefined) {
      fields.push("description = ?");
      values.push(validated.description);
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    // Always update updated_by
    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await DepartmentModel.update(connection, id, fields, values);

    const updatedDepartment = await DepartmentModel.findById(id, connection);

    await connection.commit();

    return {
      message: "Department updated",
      oldDepartment,
      updatedDepartment,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const updateDepartmentStatus = async (id, status, currentUser = null) => {
  if (!status) {
    throw { status: 400, message: "status is required" };
  }

  const normalized = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(normalized)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }

  const oldDepartment = await DepartmentModel.findById(id);
  if (!oldDepartment) {
    throw { status: 404, message: "Department not found" };
  }

  const db = getDB();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await DepartmentModel.update(
      connection,
      id,
      ["status = ?", "updated_by = ?"],
      [normalized, currentUser?.id || null],
    );

    const updatedDepartment = await DepartmentModel.findById(id, connection);

    await connection.commit();

    return {
      message: `Department status updated to ${normalized}`,
      oldDepartment,
      updatedDepartment,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getAllDepartments = async (query = {}) => {
  const filters = validateDepartmentFilters(query);
  return await DepartmentModel.findAll(filters);
};

export const getAllDepartmentsByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // Get user + school
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

  const filters = validateDepartmentFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await DepartmentModel.findAll(filters);
};

export const getDepartmentById = async (id) => {
  const department = await DepartmentModel.findById(id);

  if (!department) {
    throw {
      status: 404,
      message: "Department not found",
    };
  }

  return department;
};

export const getDepartmentsBySchool = async (school_id, query = {}) => {
  const filters = validateDepartmentFilters({ ...query, school_id });
  return await DepartmentModel.findAll(filters);
};

export const deleteDepartment = async (id) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const department = await DepartmentModel.findById(id);
    if (!department) {
      throw { status: 404, message: "Department not found" };
    }

    await connection.beginTransaction();

    await DepartmentModel.delete(connection, id);

    await connection.commit();

    return {
      message: "Department deleted",
      deletedDepartment: department,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const checkExistingDepartment = async (data = {}) => {
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
      d.id,
      d.school_id,
      d.name,
      d.description,
      d.status
    FROM departments d
    WHERE d.school_id = ?
      AND UPPER(d.name) = UPPER(?)
  `;
  const params = [school_id, name];

  if (excludeId) {
    sql += ` AND d.id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    department: existing || null,
  };
};
