import { getDB } from "../../config/db.js";
import {
  validateCreate,
  validateUpdate,
} from "./employeeSalaryStructure.validation.js";
import { SalaryStructureModel } from "./employeeSalaryStructure.model.js";

// export const createSalaryStructure = async (data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateCreate(data);

//     await conn.beginTransaction();

//     // 🔥 1. Get employee (IMPORTANT)
//     const [[employee]] = await conn.query(
//       `SELECT id, school_id, designation FROM employees WHERE id=?`,
//       [validated.employee_id],
//     );

//     if (!employee) {
//       throw { status: 404, message: "Employee not found" };
//     }

//     // 🔥 2. Auto school_id
//     validated.school_id = employee.school_id;

//     // 🔥 3. Auto structure_name (REAL LOGIC)
//     const year = new Date(validated.effective_from).getFullYear();

//     validated.structure_name = `${
//       employee.designation || "Employee"
//     } Salary ${year}`;

//     // 🔥 4. Prevent overlapping structures
//     const [overlap] = await conn.query(
//       `
//       SELECT id FROM employee_salary_structures
//       WHERE employee_id = ?
//       AND status = 'active'
//       AND (
//         effective_to IS NULL OR effective_to >= ?
//       )
//       `,
//       [validated.employee_id, validated.effective_from],
//     );

//     if (overlap.length) {
//       throw {
//         status: 409,
//         message: "Active salary structure already exists",
//       };
//     }

//     const id = await SalaryStructureModel.create(conn, validated);

//     await conn.commit();

//     return { message: "Created", id };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

export const createSalaryStructure = async (data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!user) {
      throw { status: 401, message: "Unauthorized" };
    }

    const validated = validateCreate(data);

    await conn.beginTransaction();

    // 🔥 1. Get employee (for school_id)
    const [[employee]] = await conn.query(
      `SELECT id, school_id, designation 
       FROM employees 
       WHERE id = ?`,
      [validated.employee_id],
    );

    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    // 🔥 2. AUTO school_id
    validated.school_id = employee.school_id;

    // 🔥 3. AUTO created_by from token
    validated.created_by = user.id;

    // 🔥 4. AUTO structure_name
    const year = new Date(validated.effective_from).getFullYear();

    validated.structure_name = `${
      employee.designation || "Employee"
    } Salary ${year}`;

    // 🔥 5. Prevent overlapping active structure
    const [overlap] = await conn.query(
      `
      SELECT id 
      FROM employee_salary_structures
      WHERE employee_id = ?
      AND status = 'active'
      AND (effective_to IS NULL OR effective_to >= ?)
      `,
      [validated.employee_id, validated.effective_from],
    );

    if (overlap.length) {
      throw {
        status: 409,
        message: "Active salary structure already exists",
      };
    }

    // 🔥 6. Insert
    const id = await SalaryStructureModel.create(conn, validated);

    await conn.commit();

    return {
      message: "Salary structure created",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSalaryStructure = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdate(data);

    await conn.beginTransaction();

    const existing = await SalaryStructureModel.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Not found" };
    }

    const fields = [];
    const values = [];

    Object.keys(validated).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(validated[key]);
    });

    if (fields.length) {
      await SalaryStructureModel.update(conn, id, fields, values);
    }

    await conn.commit();

    return { message: "Updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSalaryStructures = async () => {
  const db = getDB();

  const rows = await SalaryStructureModel.getAll(db);

  return rows;
};

export const getSalaryStructureById = async (id) => {
  const db = getDB();

  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const [rows] = await db.query(
    `
    SELECT 
      ess.*,

      e.first_name,
      e.last_name,
      e.designation,

      sc.name AS school_name

    FROM employee_salary_structures ess
    JOIN employees e ON ess.employee_id = e.id
    JOIN schools sc ON ess.school_id = sc.id

    WHERE ess.id = ?
    `,
    [id],
  );

  if (!rows.length) {
    throw { status: 404, message: "Salary structure not found" };
  }

  return rows[0];
};

export const deleteSalaryStructure = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) {
      throw { status: 400, message: "id required" };
    }

    await conn.beginTransaction();

    // 🔍 Check exists
    const existing = await SalaryStructureModel.findById(conn, id);

    if (!existing) {
      throw { status: 404, message: "Salary structure not found" };
    }

    // 🔥 Prevent deleting active structure (optional but recommended)
    if (existing.status === "active") {
      throw {
        status: 400,
        message: "Cannot delete active salary structure",
      };
    }

    await SalaryStructureModel.delete(conn, id);

    await conn.commit();

    return { message: "Deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSalaryStructuresByToken = async (user) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 detect admin properly (handle both formats)
  const isAdmin =
    user.role === "ADMIN" ||
    user.roles?.includes("ADMIN") ||
    user.roles?.some((r) => r.name === "ADMIN");

  let query = `
    SELECT 
      ess.*,

      e.first_name,
      e.last_name,
      e.designation,

      sc.name AS school_name

    FROM employee_salary_structures ess
    JOIN employees e ON ess.employee_id = e.id
    JOIN schools sc ON ess.school_id = sc.id
  `;

  const values = [];

  // 🔥 NON-ADMIN → restrict by school
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` WHERE ess.school_id = ?`;
    values.push(user.school_id);
  }

  // ✅ ALWAYS at end
  query += ` ORDER BY ess.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};
