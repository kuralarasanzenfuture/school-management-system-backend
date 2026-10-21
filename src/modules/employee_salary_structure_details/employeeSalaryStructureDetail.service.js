import { getDB } from "../../config/db.js";
import { SalaryStructureDetailsModel } from "./employeeSalaryStructureDetail.model.js";
import {
  validateCreate,
  validateUpdate,
  validateSalaryStructureDetailFilters,
} from "./employeeSalaryStructureDetail.validation.js";

const ALLOWED_SORT_FIELDS = {
  id: "d.id",
  salary_structure_id: "d.salary_structure_id",
  component_id: "d.component_id",
  calculation_type: "d.calculation_type",
  amount: "d.amount",
  percentage: "d.percentage",
  based_on: "d.based_on",
  created_at: "d.created_at",
  component_name: "c.name",
  structure_name: "s.structure_name",
  school_name: "sc.name",
  employee_name: "e.first_name",
};

/* =================================================================
   BUILD FILTER CLAUSES
================================================================= */
export const buildSalaryStructureDetailFilterClauses = (filters = {}) => {
  const conditions = [];
  const values = [];

  // 1. Salary Structure ID (exact, comma-separated, or array)
  if (
    filters.salary_structure_id !== undefined &&
    filters.salary_structure_id !== null &&
    filters.salary_structure_id !== ""
  ) {
    if (Array.isArray(filters.salary_structure_id)) {
      conditions.push(
        `d.salary_structure_id IN (${filters.salary_structure_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.salary_structure_id);
    } else if (String(filters.salary_structure_id).includes(",")) {
      const ids = String(filters.salary_structure_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(
        `d.salary_structure_id IN (${ids.map(() => "?").join(",")})`,
      );
      values.push(...ids);
    } else {
      conditions.push("d.salary_structure_id = ?");
      values.push(filters.salary_structure_id);
    }
  }

  // 2. Component ID (exact, comma-separated, or array)
  if (
    filters.component_id !== undefined &&
    filters.component_id !== null &&
    filters.component_id !== ""
  ) {
    if (Array.isArray(filters.component_id)) {
      conditions.push(
        `d.component_id IN (${filters.component_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.component_id);
    } else if (String(filters.component_id).includes(",")) {
      const ids = String(filters.component_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`d.component_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("d.component_id = ?");
      values.push(filters.component_id);
    }
  }

  // 3. School ID (exact, comma-separated, or array from joined structure)
  if (
    filters.school_id !== undefined &&
    filters.school_id !== null &&
    filters.school_id !== ""
  ) {
    if (Array.isArray(filters.school_id)) {
      conditions.push(
        `s.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`s.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("s.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 4. Employee ID (exact, comma-separated, or array from joined structure)
  if (
    filters.employee_id !== undefined &&
    filters.employee_id !== null &&
    filters.employee_id !== ""
  ) {
    if (Array.isArray(filters.employee_id)) {
      conditions.push(
        `s.employee_id IN (${filters.employee_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.employee_id);
    } else if (String(filters.employee_id).includes(",")) {
      const ids = String(filters.employee_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`s.employee_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("s.employee_id = ?");
      values.push(filters.employee_id);
    }
  }

  // 5. Calculation Type (fixed, percentage)
  if (filters.calculation_type) {
    const types = String(filters.calculation_type)
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (types.length === 1) {
      conditions.push("d.calculation_type = ?");
      values.push(types[0]);
    } else if (types.length > 1) {
      conditions.push(
        `d.calculation_type IN (${types.map(() => "?").join(",")})`,
      );
      values.push(...types);
    }
  }

  // 6. Based On (basic, gross)
  if (filters.based_on) {
    const basedOnTypes = String(filters.based_on)
      .split(",")
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean);
    if (basedOnTypes.length === 1) {
      conditions.push("d.based_on = ?");
      values.push(basedOnTypes[0]);
    } else if (basedOnTypes.length > 1) {
      conditions.push(
        `d.based_on IN (${basedOnTypes.map(() => "?").join(",")})`,
      );
      values.push(...basedOnTypes);
    }
  }

  // 7. Component Type (earning, deduction)
  if (filters.component_type) {
    const cTypes = String(filters.component_type)
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (cTypes.length === 1) {
      conditions.push("c.component_type = ?");
      values.push(cTypes[0]);
    } else if (cTypes.length > 1) {
      conditions.push(
        `c.component_type IN (${cTypes.map(() => "?").join(",")})`,
      );
      values.push(...cTypes);
    }
  }

  // 8. Global Search
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      c.name LIKE ? OR
      c.code LIKE ? OR
      s.structure_name LIKE ? OR
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      e.employee_code LIKE ? OR
      sc.name LIKE ?
    )`);
    values.push(term, term, term, term, term, term, term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, values };
};

/* =================================================================
   BUILD FILTER DISPLAY HELPER
================================================================= */
export const buildFilterDisplay = (filters = {}) => {
  const display = {};
  if (filters.search || filters.q) {
    display.search = String(filters.search || filters.q).trim();
  }
  if (filters.salary_structure_id) {
    display.salary_structure_id = filters.salary_structure_id;
  }
  if (filters.component_id) {
    display.component_id = filters.component_id;
  }
  if (filters.calculation_type) {
    display.calculation_type = filters.calculation_type;
  }
  if (filters.based_on) {
    display.based_on = filters.based_on;
  }
  if (filters.component_type) {
    display.component_type = filters.component_type;
  }
  if (filters.school_id) {
    display.school_id = filters.school_id;
  }
  if (filters.employee_id) {
    display.employee_id = filters.employee_id;
  }
  if (filters.sort_by || filters.sortBy) {
    display.sorted_by = `${filters.sort_by || filters.sortBy} (${String(filters.sort_order || filters.sortOrder || "DESC").toUpperCase()})`;
  }
  return display;
};

/* =================================================================
   CREATE SALARY STRUCTURE DETAIL
================================================================= */
export const createSalaryStructureDetail = async (data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    await conn.beginTransaction();

    // 🔒 1. Lock parent structure
    const [[structure]] = await conn.query(
      `SELECT id, school_id, structure_name, employee_id 
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
      `SELECT id, name, code, component_type 
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

    // 🔴 4. Business validation
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
    const created = await SalaryStructureDetailsModel.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Created successfully",
      id,
      data: created,
      detail: created,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   BULK UPSERT SALARY STRUCTURE DETAILS
================================================================= */
export const bulkUpsertSalaryStructureDetails = async (data, user = null) => {
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
      `SELECT id, school_id, structure_name, employee_id 
       FROM employee_salary_structures 
       WHERE id=? 
       FOR UPDATE`,
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

    // 🔥 3. Pre-fetch existing components
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

    // Fetch all current details for response
    const [allDetails] = await conn.query(
      `
      SELECT 
        d.*,
        c.name AS component_name,
        c.code AS component_code,
        c.component_type
      FROM employee_salary_structure_details d
      JOIN employee_salary_components c ON d.component_id = c.id
      WHERE d.salary_structure_id = ?
      ORDER BY d.id ASC
      `,
      [salary_structure_id],
    );

    await conn.commit();

    return {
      success: true,
      message: "Bulk upsert success",
      salary_structure_id: Number(salary_structure_id),
      school_id: structure.school_id,
      structure_name: structure.structure_name,
      count: components.length,
      data: allDetails,
      details: allDetails,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   GET ALL SALARY STRUCTURE DETAILS (FILTERS & PAGINATION)
================================================================= */
export const getAllSalaryStructureDetails = async (query = {}) => {
  const db = getDB();

  const filters = validateSalaryStructureDetailFilters(query);
  const { whereClause, values } =
    buildSalaryStructureDetailFilterClauses(filters);
  const total = await SalaryStructureDetailsModel.countWithFilters(db, {
    whereClause,
    values: [...values],
  });

  const sortBy = String(filters.sort_by || filters.sortBy || "id").toLowerCase();
  const sortOrder = String(
    filters.sort_order || filters.sortOrder || filters.order || "DESC",
  ).toUpperCase();
  const validOrder = sortOrder === "ASC" ? "ASC" : "DESC";

  let orderClause = "ORDER BY d.id DESC";
  if (ALLOWED_SORT_FIELDS[sortBy]) {
    orderClause = `ORDER BY ${ALLOWED_SORT_FIELDS[sortBy]} ${validOrder}`;
  }

  const isAll =
    filters.all === "true" ||
    filters.all === true ||
    filters.limit === "all" ||
    Number(filters.limit) === -1;

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = isAll
    ? null
    : Math.max(1, Math.min(Number(filters.limit) || 20, 500));
  const offset = isAll
    ? 0
    : filters.offset !== undefined
      ? Math.max(0, Number(filters.offset))
      : (page - 1) * limit;

  let limitClause = "";
  const queryValues = [...values];
  if (!isAll && limit !== null) {
    limitClause = "LIMIT ? OFFSET ?";
    queryValues.push(limit, offset);
  }

  const rows = await SalaryStructureDetailsModel.findWithFilters(db, {
    whereClause,
    values: queryValues,
    orderClause,
    limitClause,
  });

  const totalPages = isAll ? 1 : Math.ceil(total / (limit || 1));
  const from = total === 0 ? 0 : offset + 1;
  const to = total === 0 ? 0 : Math.min(offset + rows.length, total);
  const count = rows.length;

  const filterDisplay = buildFilterDisplay(filters);

  return {
    rows,
    pagination: {
      total,
      page: isAll ? 1 : page,
      limit: isAll ? total : limit,
      total_pages: totalPages === 0 ? 1 : totalPages,
      totalPages: totalPages === 0 ? 1 : totalPages,
      from,
      to,
      count,
      has_next: isAll ? false : page < totalPages,
      hasNextPage: isAll ? false : page < totalPages,
      has_prev: isAll ? false : page > 1,
      hasPrevPage: isAll ? false : page > 1,
    },
    filter_display: filterDisplay,
    filters,
  };
};

/* =================================================================
   GET SALARY STRUCTURE DETAILS BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getAllSalaryStructureDetailsByToken = async (user, query = {}) => {
  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  const db = getDB();

  // Fresh user check with role & school resolution
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

  const roles = dbUser.roles ? dbUser.roles.split(",").filter(Boolean) : [];
  const isAdmin =
    roles.includes("ADMIN") ||
    roles.includes("SUPER_ADMIN") ||
    user.roles?.includes("ADMIN") ||
    user.role === "admin" ||
    user.role === "ADMIN";

  const scopedFilters = { ...query };

  // Non-admins are locked to their own school
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "No school assigned to user" };
    }
    scopedFilters.school_id = dbUser.school_id;
  }

  return await getAllSalaryStructureDetails(scopedFilters);
};

/* =================================================================
   GET SALARY STRUCTURE DETAIL BY ID
================================================================= */
export const getSalaryStructureDetailById = async (id) => {
  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const db = getDB();
  const row = await SalaryStructureDetailsModel.findById(db, id);

  if (!row) {
    throw { status: 404, message: "Detail not found" };
  }

  return row;
};

/* =================================================================
   UPDATE SALARY STRUCTURE DETAIL
================================================================= */
export const updateSalaryStructureDetail = async (id, data, user = null) => {
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
    if (
      validated.component_id &&
      validated.component_id !== existing.component_id
    ) {
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
        throw { status: 400, message: "Valid amount required for fixed type" };
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

    await SalaryStructureDetailsModel.update(conn, id, validated);
    const updated = await SalaryStructureDetailsModel.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Updated successfully",
      id: Number(id),
      old_data: existing,
      new_data: updated,
      data: updated,
      detail: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   DELETE SALARY STRUCTURE DETAIL
================================================================= */
export const deleteSalaryStructureDetail = async (id, user = null) => {
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

    return {
      success: true,
      message: "Deleted successfully",
      id: Number(id),
      deletedDetail: existing,
      data: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   CALCULATE SALARY BY EMPLOYEE ID
================================================================= */
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
      c.component_type AS type
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
        // skip now, calculate in pass 2
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

/* =================================================================
   GET FULL SALARY BY EMPLOYEE ID
================================================================= */
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
