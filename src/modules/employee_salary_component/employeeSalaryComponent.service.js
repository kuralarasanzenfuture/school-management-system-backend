import { getDB } from "../../config/db.js";
import { ComponentModel as Model } from "./employeeSalaryComponent.model.js";
import {
  validateCreate,
  validateUpdate,
} from "./employeeSalaryComponent.validation.js";
import { SchoolModel } from "../schools/school.model.js";

export const createComponent = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    await conn.beginTransaction();

    // 🔥 school check
    const schoolExists = await SchoolModel.existsById(
      conn,
      validated.school_id,
    );
    if (!schoolExists) {
      throw { status: 400, message: "Invalid school_id" };
    }

    // 🔥 duplicate check
    const exists = await Model.findDuplicate(
      conn,
      validated.school_id,
      validated.code,
    );

    if (exists) {
      throw { status: 409, message: "Component code already exists" };
    }

    const id = await Model.create(conn, validated);

    await conn.commit();

    return { message: "Component created", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateComponent = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdate(data);

    await conn.beginTransaction();

    const existing = await Model.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Component not found" };
    }

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

    await Model.update(conn, id, validated);

    await conn.commit();

    return { message: "Component updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllComponents = async () => {
  const db = getDB();
  return await Model.getAll(db);
};

export const getComponentsByToken = async (user) => {
  const db = getDB();

  // 🔴 1. Basic auth check
  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 2. Detect ADMIN properly (don’t assume one format)
  const isAdmin =
    user.role === "ADMIN" ||
    user.roles?.includes("ADMIN") ||
    user.roles?.some((r) => r.name === "ADMIN");

  // 🔹 3. Base query
  let query = `
    SELECT
      esc.*,
      sc.name AS school_name,
      sc.code AS school_code
    FROM employee_salary_components esc
    JOIN schools sc ON esc.school_id = sc.id
  `;

  const values = [];

  // 🔥 4. Apply school filter BEFORE ORDER BY
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned to user" };
    }

    query += ` WHERE esc.school_id = ?`;
    values.push(user.school_id);
  }

  // 🔹 5. Always at end
  query += ` ORDER BY esc.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getComponentById = async (id) => {
  const db = getDB();

  const [[row]] = await db.query(
    `
    SELECT 
      esc.id,
      esc.name,
      esc.code,
      esc.component_type,
      esc.calculation_type,
      esc.status,
      esc.created_at,
      esc.updated_at,

      sc.id AS school_id,
      sc.name AS school_name,
      sc.code AS school_code

    FROM employee_salary_components esc
    JOIN schools sc 
      ON esc.school_id = sc.id

    WHERE esc.id = ?
    `,
    [id],
  );

  return row;
};

export const deleteComponent = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await Model.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Component not found" };
    }

    await Model.delete(conn, id);

    await conn.commit();

    return { message: "Component deleted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingComponent = async (query) => {
  const db = getDB();

  const { school_id, name, code, exclude_id } = query;

  // 🔴 Required validation
  if (!school_id) {
    throw { status: 400, message: "school_id required" };
  }

  if (!name && !code) {
    throw { status: 400, message: "name or code required" };
  }

  // 🔹 Base query
  let sql = `
    SELECT id, name, code
    FROM employee_salary_components
    WHERE school_id = ?
  `;
  const values = [Number(school_id)];

  // 🔹 Dynamic conditions
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

  // 🔥 Exclude current record (for update case)
  if (exclude_id) {
    sql += ` AND id != ?`;
    values.push(Number(exclude_id));
  }

  const [rows] = await db.query(sql, values);

  return {
    available: rows.length === 0,
    exists: rows.length > 0,
    conflicts: rows,
  };
};
