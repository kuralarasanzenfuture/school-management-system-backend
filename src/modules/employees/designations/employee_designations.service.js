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
    // const [[exists]] = await conn.query(
    //   `SELECT id FROM employee_designations WHERE name=?`,
    //   [validated.name],
    // );

    const [[exists]] = await conn.query(
      `
  SELECT id 
  FROM employee_designations 
  WHERE name = ? 
    AND school_id = ?
  `,
      [validated.name, validated.school_id],
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
        `
    SELECT id 
    FROM employee_designations 
    WHERE name = ? 
      AND school_id = ? 
      AND id != ?
    `,
        [validated.name, existing.school_id, id],
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

export const getAllDesignationsByToken = async (user) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 Fetch fresh user + roles
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
    FROM employee_designations
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

export const getDesignationById = async (id) => {
  try {
    const designation = await EmployeeDesignationModel.findById(id);
    return { designation };
  } catch (err) {
    throw err;
  }
};
