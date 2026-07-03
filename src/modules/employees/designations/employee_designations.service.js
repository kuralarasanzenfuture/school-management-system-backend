import { getDB } from "../../../config/db.js";
import { EmployeeDesignationModel } from "./employee_designations.model.js";
import {
  validateCreateDesignation,
  validateUpdateDesignation,
} from "./employee_designations.validation.js";

export const createDesignation = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateDesignation(data);

    await conn.beginTransaction();

    // 🔴 DUPLICATE CHECK (GLOBAL OR PER SCHOOL)
    const [[exists]] = await conn.query(
      `SELECT id FROM employee_designations WHERE name=?`,
      [validated.name]
    );

    if (exists) {
      throw { status: 409, message: "Designation already exists" };
    }

    const id = await EmployeeDesignationModel.create(conn, validated);

    await conn.commit();

    return {
      message: "Designation created successfully",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateDesignation = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const validated = validateUpdateDesignation(data);

    await conn.beginTransaction();

    const existing = await EmployeeDesignationModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Designation not found" };
    }

    // 🔴 DUPLICATE CHECK (if name updating)
    if (validated.name) {
      const [[exists]] = await conn.query(
        `SELECT id FROM employee_designations WHERE name=? AND id!=?`,
        [validated.name, id]
      );

      if (exists) {
        throw { status: 409, message: "Designation already exists" };
      }
    }

    await EmployeeDesignationModel.update(conn, id, validated);

    await conn.commit();

    return { message: "Designation updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteDesignation = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await EmployeeDesignationModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Designation not found" };
    }

    await EmployeeDesignationModel.delete(conn, id);

    await conn.commit();

    return { message: "Designation deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllDesignations = async (school_id) => {
  try {
    const designations = await EmployeeDesignationModel.getAllSchool(school_id);
    return { designations };
  } catch (err) {
    throw err;
  }
};

export const getDesignationById = async (id) => {
  try {
    const designation = await EmployeeDesignationModel.findById(id);
    return { designation };
  } catch (err) {
    throw err;
  } 
};