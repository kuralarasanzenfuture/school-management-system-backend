import { getDB } from "../../config/db.js";
import { SalaryStructureDetailsModel } from "./employeeSalaryStructureDetail.model.js";
import {
  validateCreate,
  validateUpdate,
} from "./employeeSalaryStructureDetail.validation.js";

export const createSalaryStructureDetail = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    await conn.beginTransaction();

    // 🔒 1. Lock parent structure
    const [[structure]] = await conn.query(
      `SELECT id, school_id 
       FROM employee_salary_structures 
       WHERE id=? 
       FOR UPDATE`,
      [validated.salary_structure_id],
    );

    if (!structure) {
      throw { status: 404, message: "Salary structure not found" };
    }

    // 🔒 2. Validate component exists
    const [[component]] = await conn.query(
      `SELECT id 
       FROM employee_salary_components 
       WHERE id=?`,
      [validated.component_id],
    );

    if (!component) {
      throw { status: 404, message: "Component not found" };
    }

    // 🔥 3. Duplicate check
    const exists = await SalaryStructureDetailsModel.findDuplicate(
      conn,
      validated.salary_structure_id,
      validated.component_id,
    );

    if (exists) {
      throw {
        status: 409,
        message: "Component already exists in structure",
      };
    }

    // 🔴 4. Business validation (critical)
    if (validated.calculation_type === "percentage") {
      if (validated.percentage > 100) {
        throw {
          status: 400,
          message: "Percentage cannot exceed 100",
        };
      }
    }

    if (
      validated.calculation_type === "fixed" &&
      validated.percentage !== null
    ) {
      throw {
        status: 400,
        message: "Fixed type should not have percentage",
      };
    }

    if (
      validated.calculation_type === "percentage" &&
      validated.amount !== null
    ) {
      throw {
        status: 400,
        message: "Percentage type should not have amount",
      };
    }

    // ✅ 5. Insert
    const id = await SalaryStructureDetailsModel.create(conn, validated);

    await conn.commit();

    return { message: "Created successfully", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const bulkUpsertSalaryStructureDetails = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { salary_structure_id, components } = data;

    // 🔴 Basic validation
    if (
      !salary_structure_id ||
      !Array.isArray(components) ||
      components.length === 0
    ) {
      throw {
        status: 400,
        message: "salary_structure_id and components[] required",
      };
    }

    await conn.beginTransaction();

    // 🔥 1. Check salary structure exists (LOCK)
    const [[structure]] = await conn.query(
      `SELECT id FROM employee_salary_structures WHERE id=? FOR UPDATE`,
      [salary_structure_id],
    );

    if (!structure) {
      throw { status: 404, message: "Salary structure not found" };
    }

    // 🔥 2. Validate duplicate component_id inside request
    const seen = new Set();
    for (const item of components) {
      if (seen.has(item.component_id)) {
        throw {
          status: 400,
          message: `Duplicate component_id ${item.component_id} in request`,
        };
      }
      seen.add(item.component_id);
    }

    // 🔥 3. Pre-fetch existing components (OPTIMIZED)
    const [existingRows] = await conn.query(
      `SELECT id, component_id 
       FROM employee_salary_structure_details
       WHERE salary_structure_id = ?`,
      [salary_structure_id],
    );

    const existingMap = new Map(
      existingRows.map((row) => [row.component_id, row.id]),
    );

    // 🔥 4. Process each component
    for (const item of components) {
      const validated = validateCreate({
        ...item,
        salary_structure_id,
      });

      // 🔴 Extra business validation
      if (validated.calculation_type === "percentage") {
        if (validated.percentage > 100) {
          throw {
            status: 400,
            message: `Percentage cannot exceed 100 for component ${validated.component_id}`,
          };
        }
      }

      if (
        validated.calculation_type === "fixed" &&
        validated.percentage !== null
      ) {
        throw {
          status: 400,
          message: `Fixed type should not have percentage (component ${validated.component_id})`,
        };
      }

      if (
        validated.calculation_type === "percentage" &&
        validated.amount !== null
      ) {
        throw {
          status: 400,
          message: `Percentage type should not have amount (component ${validated.component_id})`,
        };
      }

      const existingId = existingMap.get(validated.component_id);

      if (existingId) {
        // 🔄 UPDATE
        await SalaryStructureDetailsModel.update(
          conn,
          existingId,
          ["calculation_type=?", "amount=?", "percentage=?", "based_on=?"],
          [
            validated.calculation_type,
            validated.amount,
            validated.percentage,
            validated.based_on,
          ],
        );
      } else {
        // ➕ INSERT
        await SalaryStructureDetailsModel.create(conn, validated);
      }
    }

    await conn.commit();

    return { message: "Bulk upsert success" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSalaryStructureDetails = async () => {
  const db = getDB();

  const [rows] = await db.query(`
    SELECT 
      d.*,

      s.structure_name,
      s.employee_id,

      c.name AS component_name,
      c.component_type AS component_type

    FROM employee_salary_structure_details d

    JOIN employee_salary_structures s 
      ON d.salary_structure_id = s.id

    JOIN employee_salary_components c 
      ON d.component_id = c.id

    ORDER BY d.id DESC
  `);

  return rows;
};

export const getAllSalaryStructureDetailsByToken = async (user) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 Handle all role formats
  const isAdmin =
    user.role === "ADMIN" ||
    user.roles?.includes("ADMIN") ||
    user.roles?.some((r) => r.name === "ADMIN");

  let query = `
    SELECT 
      d.*,

      s.structure_name,
      s.employee_id,

      e.first_name,
      e.last_name,
      e.designation,

      c.name AS component_name,
      c.component_type AS component_type,

      sc.name AS school_name

    FROM employee_salary_structure_details d

    JOIN employee_salary_structures s 
      ON d.salary_structure_id = s.id

    JOIN employees e 
      ON s.employee_id = e.id

    JOIN employee_salary_components c 
      ON d.component_id = c.id

    JOIN schools sc 
      ON s.school_id = sc.id
  `;

  const values = [];

  // 🔥 NON-ADMIN restriction
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` WHERE s.school_id = ?`;
    values.push(user.school_id);
  }

  // ✅ always last
  query += ` ORDER BY d.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getSalaryStructureDetailById = async (id) => {
  const db = getDB();

  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const [[row]] = await db.query(
    `
    SELECT 
      d.*,

      s.structure_name,
      s.employee_id,

      c.name AS component_name,
      c.component_type AS component_type

    FROM employee_salary_structure_details d

    JOIN employee_salary_structures s 
      ON d.salary_structure_id = s.id

    JOIN employee_salary_components c 
      ON d.component_id = c.id

    WHERE d.id = ?
    `,
    [id],
  );

  if (!row) {
    throw { status: 404, message: "Detail not found" };
  }

  return row;
};

export const updateSalaryStructureDetail = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) {
      throw { status: 400, message: "id required" };
    }

    const validated = validateUpdate(data);

    await conn.beginTransaction();

    // 🔥 LOCK row
    const existing = await SalaryStructureDetailsModel.findById(conn, id);

    if (!existing) {
      throw { status: 404, message: "Detail not found" };
    }

    // 🔥 Check duplicate if component_id changed
    if (validated.component_id) {
      const dup = await SalaryStructureDetailsModel.findDuplicate(
        conn,
        existing.salary_structure_id,
        validated.component_id,
        id,
      );

      if (dup) {
        throw {
          status: 409,
          message: "Component already exists in this structure",
        };
      }
    }

    // 🔥 Final merged values
    const calcType = validated.calculation_type ?? existing.calculation_type;

    const amount =
      validated.amount !== undefined ? validated.amount : existing.amount;

    const percentage =
      validated.percentage !== undefined
        ? validated.percentage
        : existing.percentage;

    // 🔴 strict logic validation
    if (calcType === "fixed") {
      if (!amount || amount <= 0) {
        throw { status: 400, message: "Valid amount required" };
      }
      validated.percentage = null; // cleanup
    }

    if (calcType === "percentage") {
      if (!percentage || percentage <= 0) {
        throw { status: 400, message: "Valid percentage required" };
      }

      if (percentage > 100) {
        throw {
          status: 400,
          message: "Percentage cannot exceed 100",
        };
      }

      validated.amount = null; // cleanup
    }

    // 🔧 dynamic update
    const fields = [];
    const values = [];

    Object.entries(validated).forEach(([key, val]) => {
      fields.push(`${key}=?`);
      values.push(val);
    });

    if (!fields.length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await SalaryStructureDetailsModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteSalaryStructureDetail = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) {
      throw { status: 400, message: "id required" };
    }

    await conn.beginTransaction();

    const existing = await SalaryStructureDetailsModel.findById(conn, id);

    if (!existing) {
      throw { status: 404, message: "Detail not found" };
    }

    await SalaryStructureDetailsModel.delete(conn, id);

    await conn.commit();

    return { message: "Deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
