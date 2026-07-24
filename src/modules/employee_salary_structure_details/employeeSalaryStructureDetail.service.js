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

export const calculateSalary = async (employee_id) => {
  const db = getDB();

  // 🔥 1. Get active salary structure
  const [[structure]] = await db.query(
    `
    SELECT *
    FROM employee_salary_structures
    WHERE employee_id = ?
      AND status = 'active'
      AND (effective_to IS NULL OR effective_to >= CURDATE())
    ORDER BY effective_from DESC
    LIMIT 1
    `,
    [employee_id],
  );

  if (!structure) {
    throw { status: 404, message: "No active salary structure" };
  }

  // 🔥 2. Get components
  const [components] = await db.query(
    `
    SELECT 
      d.*,
      c.name,
      c.type
    FROM employee_salary_structure_details d
    JOIN employee_salary_components c 
      ON d.component_id = c.id
    WHERE d.salary_structure_id = ?
    `,
    [structure.id],
  );

  if (!components.length) {
    throw { status: 400, message: "No salary components found" };
  }

  // 🔥 3. Find BASIC
  const basicComponent = components.find(
    (c) => c.name.toLowerCase() === "basic",
  );

  if (!basicComponent) {
    throw { status: 400, message: "Basic component required" };
  }

  if (basicComponent.calculation_type !== "fixed") {
    throw { status: 400, message: "Basic must be fixed" };
  }

  let basic = Number(basicComponent.amount);

  // 🔥 4. Calculate earnings
  let earnings = [];
  let gross = basic;

  for (const comp of components) {
    if (comp.type !== "earning") continue;
    if (comp.name.toLowerCase() === "basic") continue;

    let value = 0;

    if (comp.calculation_type === "fixed") {
      value = Number(comp.amount);
    } else if (comp.calculation_type === "percentage") {
      if (comp.based_on === "basic") {
        value = (basic * comp.percentage) / 100;
      } else if (comp.based_on === "gross") {
        // ⚠️ skip now, calculate later
        continue;
      }
    }

    earnings.push({ name: comp.name, value });
    gross += value;
  }

  // 🔥 5. Handle % based on gross (second pass)
  for (const comp of components) {
    if (comp.type !== "earning") continue;

    if (comp.calculation_type === "percentage" && comp.based_on === "gross") {
      const value = (gross * comp.percentage) / 100;
      earnings.push({ name: comp.name, value });
      gross += value;
    }
  }

  // 🔥 6. Calculate deductions
  let deductions = [];
  let totalDeductions = 0;

  for (const comp of components) {
    if (comp.type !== "deduction") continue;

    let value = 0;

    if (comp.calculation_type === "fixed") {
      value = Number(comp.amount);
    } else if (comp.calculation_type === "percentage") {
      if (comp.based_on === "basic") {
        value = (basic * comp.percentage) / 100;
      } else {
        value = (gross * comp.percentage) / 100;
      }
    }

    deductions.push({ name: comp.name, value });
    totalDeductions += value;
  }

  // 🔥 7. Net salary
  const net = gross - totalDeductions;

  return {
    employee_id,
    structure_id: structure.id,

    basic,

    earnings,
    gross,

    deductions,
    total_deductions: totalDeductions,

    net_salary: net,
  };
};

export const getFullSalaryByEmployee = async (employee_id) => {
  const db = getDB();

  if (!employee_id) {
    throw { status: 400, message: "employee_id required" };
  }

  // 🔥 1. Get active structure
  const [[structure]] = await db.query(
    `
    SELECT *
    FROM employee_salary_structures
    WHERE employee_id = ?
      AND status = 'active'
      AND effective_from <= CURDATE()
      AND (effective_to IS NULL OR effective_to >= CURDATE())
    ORDER BY effective_from DESC
    LIMIT 1
    `,
    [employee_id],
  );

  if (!structure) {
    throw { status: 404, message: "No active salary structure" };
  }

  // 🔥 2. Get components
  const [components] = await db.query(
    `
    SELECT 
      d.*,
      c.name,
      c.component_type
    FROM employee_salary_structure_details d
    JOIN employee_salary_components c 
      ON d.component_id = c.id
    WHERE d.salary_structure_id = ?
    `,
    [structure.id],
  );

  if (!components.length) {
    throw { status: 400, message: "No components found" };
  }

  // 🔥 3. BASIC validation
  const basicComp = components.find((c) =>
    c.name.toLowerCase().includes("basic"),
  );

  if (!basicComp || basicComp.calculation_type !== "fixed") {
    throw { status: 400, message: "Valid BASIC component required" };
  }

  if (!basicComp.amount || basicComp.amount <= 0) {
    throw { status: 400, message: "Invalid BASIC amount" };
  }

  let basic = Number(basicComp.amount);
  let earnings = [];
  let deductions = [];
  let gross = basic;

  // 🔹 PASS 1: Earnings (except % on gross)
  for (const comp of components) {
    if (comp.component_type !== "earning") continue;
    if (comp.name.toLowerCase().includes("basic")) continue;

    let value = 0;

    if (comp.calculation_type === "fixed") {
      value = Number(comp.amount);
    } else if (
      comp.calculation_type === "percentage" &&
      comp.based_on === "basic"
    ) {
      value = (basic * comp.percentage) / 100;
    }

    earnings.push({ name: comp.name, value });
    gross += value;
  }

  // 🔹 PASS 2: % on gross
  const grossBase = gross;

  for (const comp of components) {
    if (
      comp.component_type === "earning" &&
      comp.calculation_type === "percentage" &&
      comp.based_on === "gross"
    ) {
      const value = (grossBase * comp.percentage) / 100;
      earnings.push({ name: comp.name, value });
      gross += value;
    }
  }

  // 🔹 DEDUCTIONS
  let totalDeductions = 0;

  for (const comp of components) {
    if (comp.component_type !== "deduction") continue;

    let value = 0;

    if (comp.calculation_type === "fixed") {
      value = Number(comp.amount);
    } else {
      value =
        comp.based_on === "basic"
          ? (basic * comp.percentage) / 100
          : (gross * comp.percentage) / 100;
    }

    deductions.push({ name: comp.name, value });
    totalDeductions += value;
  }

  const net_salary = gross - totalDeductions;

  const [[employee]] = await db.query(
    `
  SELECT 
    e.id,
    e.employee_code,
    CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS full_name,
    e.department,
    e.designation,
    e.status,
    s.name AS school_name
  FROM employees e
  JOIN schools s ON e.school_id = s.id
  WHERE e.id = ?
  `,
    [employee_id],
  );

  if (!employee) {
    throw { status: 404, message: "Employee not found" };
  }

  const cleanComponents = components.map((c) => ({
    name: c.name,
    type: c.component_type,
    calculation_type: c.calculation_type,
    amount: c.amount,
    percentage: c.percentage,
    based_on: c.based_on,
  }));

  // =========================
  // ✅ FINAL RESPONSE
  // =========================

  return {
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      name: employee.full_name.trim(),
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      school: employee.school_name,
    },

    structure: {
      id: structure.id,
      name: structure.structure_name,
      effective_from: structure.effective_from,
      effective_to: structure.effective_to,
      status: structure.status,
    },

    // components: cleanComponents,
    components,

    breakdown: {
      basic,
      earnings,
      gross,
      deductions,
      total_deductions: totalDeductions,
      net_salary,
    },
    monthly_ctc: gross,
    annual_ctc: gross * 12,
  };
};
