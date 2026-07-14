import { getDB } from "../../../config/db.js";
import {
  validateCreate,
  validateUpdate,
} from "./employeeLeaveType.validation.js";
import { Model } from "./employeeLeaveType.model.js";
import { SchoolModel } from "../../schools/school.model.js";

export const createLeaveType = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    await conn.beginTransaction();

    // ✅ 1. Check school exists
    const schoolExists = await SchoolModel.existsById(
      conn,
      validated.school_id,
    );
    if (!schoolExists) {
      throw { status: 400, message: "Invalid school_id" };
    }

    // ✅ 2. Duplicate code check
    const exists = await Model.findDuplicate(
      conn,
      validated.school_id,
      validated.code,
    );

    if (exists) {
      throw { status: 409, message: "Leave type code already exists" };
    }

    // ✅ 3. Cross-field validation
    if (
      validated.max_days_per_request !== null &&
      validated.max_days_per_request > validated.days_per_year
    ) {
      throw {
        status: 400,
        message: "max_days_per_request cannot exceed days_per_year",
      };
    }

    if (validated.days_per_year > 365) {
      throw { status: 400, message: "days_per_year too large" };
    }

    if (!/^[A-Z0-9_]+$/.test(validated.code)) {
      throw { status: 400, message: "Invalid code format" };
    }

    const id = await Model.create(conn, validated);

    await conn.commit();

    return { message: "Leave type created", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllLeaveTypes = async (filters = {}) => {
  const db = getDB();

  let query = `
    SELECT 
      elt.*,
      sc.name AS school_name,
      sc.code AS school_code
    FROM employee_leave_types elt
    JOIN schools sc ON elt.school_id = sc.id
    WHERE 1=1
  `;

  const values = [];

  if (filters.school_id) {
    query += ` AND elt.school_id = ?`;
    values.push(filters.school_id);
  }

  if (filters.status) {
    query += ` AND elt.status = ?`;
    values.push(filters.status);
  }

  query += ` ORDER BY elt.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const getAllLeaveTypesByToken = async (user) => {
  const db = getDB();

  if (!user) throw { status: 401, message: "Unauthorized" };

  const isAdmin = user.roles?.some((r) => r === "ADMIN" || r.name === "ADMIN");

  let query = `SELECT * FROM employee_leave_types WHERE 1=1`;
  const values = [];

  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` AND school_id=?`;
    values.push(user.school_id);
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const getLeaveTypeById = async (id) => {
  const db = getDB();

  const [[row]] = await db.query(
    `SELECT * FROM employee_leave_types WHERE id=?`,
    [id],
  );

  if (!row) throw { status: 404, message: "Leave type not found" };

  return row;
};

export const updateLeaveType = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdate(data);

    await conn.beginTransaction();

    // ✅ 1. Get existing record
    const existing = await Model.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Leave type not found" };
    }

    // ✅ 2. Duplicate code check
    if (validated.code) {
      const dup = await Model.findDuplicate(
        conn,
        existing.school_id,
        validated.code,
        id,
      );

      if (dup) {
        throw { status: 409, message: "Duplicate code" };
      }
    }

    // ✅ 3. Merge existing + new (CRITICAL)
    const finalData = {
      ...existing,
      ...validated,
    };

    // ✅ 4. Cross-field validation (REAL FIX)
    if (finalData.max_carry_forward_days > finalData.days_per_year) {
      throw {
        status: 400,
        message: "max_carry_forward_days cannot be greater than days_per_year",
      };
    }

    if (!finalData.carry_forward && finalData.max_carry_forward_days > 0) {
      throw {
        status: 400,
        message: "Cannot set carry forward days when carry_forward is false",
      };
    }

    if (
      finalData.max_days_per_request !== null &&
      finalData.max_days_per_request > finalData.days_per_year
    ) {
      throw {
        status: 400,
        message: "max_days_per_request cannot exceed days_per_year",
      };
    }

    if (finalData.days_per_year > 365) {
      throw { status: 400, message: "days_per_year too large (> 365)" };
    }

    // if (!/^[A-Z0-9_]+$/.test(finalData.code)) {
    //   throw { status: 400, message: "Invalid code format" };
    // }

    // ✅ 5. Update
    await Model.update(conn, id, validated);

    await conn.commit();

    return { message: "Leave type updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteLeaveType = async (id) => {
  const db = getDB();

  const [res] = await db.query(`DELETE FROM employee_leave_types WHERE id=?`, [
    id,
  ]);

  if (!res.affectedRows) {
    throw { status: 404, message: "Leave type not found" };
  }

  return { message: "Deleted successfully" };
};

export const checkExistingLeaveType = async (query) => {
  const db = getDB();

  const { school_id, name, code, exclude_id } = query;

  if (!school_id) {
    throw { status: 400, message: "school_id required" };
  }

  if (!name && !code) {
    throw { status: 400, message: "name or code required" };
  }

  let sql = `
    SELECT id, name, code 
    FROM employee_leave_types
    WHERE school_id = ?
  `;
  const values = [school_id];

  // 🔹 dynamic conditions
  const conditions = [];

  if (name) {
    conditions.push("name = ?");
    values.push(name.trim().toUpperCase());
  }

  if (code) {
    conditions.push("code = ?");
    values.push(code.trim().toUpperCase());
  }

  if (conditions.length) {
    sql += ` AND (${conditions.join(" OR ")})`;
  }

  // 🔥 exclude current record (for update)
  if (exclude_id) {
    sql += ` AND id != ?`;
    values.push(exclude_id);
  }

  const [rows] = await db.query(sql, values);

  return {
    available: rows.length === 0,
    exists: rows.length > 0,
    conflicts: rows, // useful for frontend
  };
};
