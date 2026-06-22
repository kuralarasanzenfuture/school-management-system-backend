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
