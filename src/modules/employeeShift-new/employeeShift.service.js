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

    // 🔴 DUPLICATE CHECK
    const exists = await Model.findDuplicate(
      conn,
      validated.school_id,
      validated.name,
    );

    if (exists) {
      throw { status: 409, message: "Shift already exists" };
    }

    // 🔥 DEFAULT SHIFT CONTROL (ONLY ONE)
    if (validated.is_default) {
      await conn.query(
        `UPDATE employee_shifts 
         SET is_default = FALSE 
         WHERE school_id = ?`,
        [validated.school_id],
      );
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

export const getAllShifts = async (filters = {}) => {
  const db = getDB();
  return await Model.getAll(db, filters);
};

export const getAllShiftsByToken = async (user, filters = {}) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  // ✅ Robust admin check
  const isAdmin =
    user.roles?.some((r) => r === "ADMIN" || r.name === "ADMIN") ||
    user.role === "ADMIN";

  let query = `
    SELECT 
      es.id,
      es.name,
      es.shift_type,
      es.start_time,
      es.end_time,
      es.crosses_midnight,
      es.working_hours,
      es.grace_minutes,
      es.is_default,
      es.status,

      sc.id AS school_id,
      sc.name AS school_name,
      sc.code AS school_code

    FROM employee_shifts es
    JOIN schools sc 
      ON es.school_id = sc.id
    WHERE 1=1
  `;

  const values = [];

  // 🔐 Role-based restriction
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` AND es.school_id = ?`;
    values.push(user.school_id);
  }

  // 🔍 Optional filters (future-proof)
  if (filters.status) {
    query += ` AND es.status = ?`;
    values.push(filters.status);
  }

  if (filters.shift_type) {
    query += ` AND es.shift_type = ?`;
    values.push(filters.shift_type);
  }

  // ✅ Always last
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
    if (!id) throw { status: 400, message: "ID required" };

    const validated = validateUpdateShift(data);

    await conn.beginTransaction();

    // 🔴 Check exists
    const existing = await Model.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Shift not found" };
    }

    // 🔴 DUPLICATE NAME CHECK
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

    // 🔥 DEFAULT SHIFT CONTROL
    if (validated.is_default === true) {
      await conn.query(
        `UPDATE employee_shifts 
         SET is_default = FALSE 
         WHERE school_id = ?`,
        [existing.school_id],
      );
    }

    // 🔧 BUILD UPDATE QUERY
    const fields = [];
    const values = [];

    Object.keys(validated).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(validated[key]);
    });

    await conn.query(
      `UPDATE employee_shifts SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );

    await conn.commit();

    return { message: "Shift updated successfully" };
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
