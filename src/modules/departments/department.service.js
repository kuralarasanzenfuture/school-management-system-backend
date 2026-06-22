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

    if (validated.name) {
      fields.push("name=?");
      values.push(validated.name);
    }

    if (validated.description !== undefined) {
      fields.push("description=?");
      values.push(validated.description);
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
