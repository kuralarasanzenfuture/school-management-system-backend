import { getDB } from "../../config/db.js";
import { EmployeeShiftModel as Model } from "./employeeShift.model.js";
import {
  validateCreateShift,
  validateUpdateShift,
} from "./employeeShift.validation.js";

export const createShift = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateShift(data);

    await conn.beginTransaction();

    const exists = await Model.findDuplicate(
      conn,
      validated.school_id,
      validated.name,
    );

    if (exists) {
      throw { status: 409, message: "Shift already exists" };
    }

    const id = await Model.create(conn, validated);

    await conn.commit();

    return { message: "Shift created", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllShifts = async () => {
  const db = getDB();
  return await Model.getAll(db);
};

export const getAllShiftsByToken = async (user) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");

  let query = `
    SELECT 
      es.*,
      sc.name AS school_name
    FROM employee_shifts es
    JOIN schools sc ON es.school_id = sc.id
  `;

  const values = [];

  // 🔥 Apply filter BEFORE ORDER BY
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` WHERE es.school_id = ?`;
    values.push(user.school_id);
  }

  // ✅ Always at the end
  query += ` ORDER BY es.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getShiftById = async (id) => {
  const db = getDB();

  const row = await Model.findById(db, id);

  if (!row) {
    throw { status: 404, message: "Shift not found" };
  }

  return row;
};

export const updateShift = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateShift(data);

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Shift not found" };
    }

    if (validated.name) {
      const dup = await Model.findDuplicate(
        conn,
        existing.school_id,
        validated.name,
        id,
      );

      if (dup) {
        throw { status: 409, message: "Shift already exists" };
      }
    }

    const fields = [];
    const values = [];

    Object.keys(validated).forEach((k) => {
      fields.push(`${k}=?`);
      values.push(validated[k]);
    });

    await conn.beginTransaction();

    await Model.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Shift updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteShift = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await Model.findById(db, id);

    if (!existing) {
      throw { status: 404, message: "Shift not found" };
    }

    await conn.beginTransaction();

    await Model.delete(conn, id);

    await conn.commit();

    return { message: "Shift deleted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
