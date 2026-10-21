import { getDB } from "../../config/db.js";
import {
  validateCreate,
  validateUpdate,
  validateSalaryStructureStatus,
  validateSalaryStructureFilters,
} from "./employeeSalaryStructure.validation.js";
import { SalaryStructureModel } from "./employeeSalaryStructure.model.js";

const ALLOWED_SORT_FIELDS = {
  id: "ess.id",
  structure_name: "ess.structure_name",
  effective_from: "ess.effective_from",
  effective_to: "ess.effective_to",
  status: "ess.status",
  school_id: "ess.school_id",
  employee_id: "ess.employee_id",
  created_by: "ess.created_by",
  created_at: "ess.created_at",
  updated_at: "ess.updated_at",
  first_name: "e.first_name",
  last_name: "e.last_name",
  employee_code: "e.employee_code",
  designation: "e.designation",
  school_name: "sc.name",
};

/* =================================================================
   HELPER: CHECK OVERLAPPING ACTIVE STRUCTURE
================================================================= */
const checkActiveStructureOverlap = async (
  conn,
  employeeId,
  effectiveFrom,
  effectiveTo = null,
  excludeId = null,
) => {
  let sql = `
    SELECT id, structure_name, effective_from, effective_to
    FROM employee_salary_structures
    WHERE employee_id = ?
      AND status = 'active'
      AND (effective_to IS NULL OR effective_to >= ?)
      AND (? IS NULL OR effective_from <= ?)
  `;
  const values = [employeeId, effectiveFrom, effectiveTo, effectiveTo];

  if (excludeId) {
    sql += " AND id != ?";
    values.push(excludeId);
  }

  const [rows] = await conn.query(sql, values);
  return rows;
};

/* =================================================================
   BUILD FILTER CLAUSES
================================================================= */
export const buildSalaryStructureFilterClauses = (filters = {}) => {
  const conditions = [];
  const values = [];

  // 1. School ID (exact, comma-separated list, or array)
  if (
    filters.school_id !== undefined &&
    filters.school_id !== null &&
    filters.school_id !== ""
  ) {
    if (Array.isArray(filters.school_id)) {
      conditions.push(
        `ess.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`ess.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("ess.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 2. Employee ID (exact, comma-separated list, or array)
  if (
    filters.employee_id !== undefined &&
    filters.employee_id !== null &&
    filters.employee_id !== ""
  ) {
    if (Array.isArray(filters.employee_id)) {
      conditions.push(
        `ess.employee_id IN (${filters.employee_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.employee_id);
    } else if (String(filters.employee_id).includes(",")) {
      const ids = String(filters.employee_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`ess.employee_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("ess.employee_id = ?");
      values.push(filters.employee_id);
    }
  }

  // 3. Global Search (structure_name, employee details, or school_name)
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      ess.structure_name LIKE ? OR
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      e.employee_code LIKE ? OR
      e.designation LIKE ? OR
      sc.name LIKE ?
    )`);
    values.push(term, term, term, term, term, term);
  }

  // 4. Structure Name
  if (filters.structure_name) {
    conditions.push("ess.structure_name LIKE ?");
    values.push(`%${String(filters.structure_name).trim()}%`);
  }

  // 5. Status (single or comma-separated)
  if (filters.status) {
    const statuses = String(filters.status)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length === 1) {
      conditions.push("ess.status = ?");
      values.push(statuses[0]);
    } else if (statuses.length > 1) {
      conditions.push(`ess.status IN (${statuses.map(() => "?").join(",")})`);
      values.push(...statuses);
    }
  }

  // 6. Effective From date filters
  if (filters.effective_from) {
    conditions.push("ess.effective_from = ?");
    values.push(filters.effective_from);
  }
  if (filters.effective_from_gte) {
    conditions.push("ess.effective_from >= ?");
    values.push(filters.effective_from_gte);
  }
  if (filters.effective_from_lte) {
    conditions.push("ess.effective_from <= ?");
    values.push(filters.effective_from_lte);
  }

  // 7. Effective To date filters
  if (filters.effective_to) {
    conditions.push("ess.effective_to = ?");
    values.push(filters.effective_to);
  }
  if (filters.effective_to_gte) {
    conditions.push("ess.effective_to >= ?");
    values.push(filters.effective_to_gte);
  }
  if (filters.effective_to_lte) {
    conditions.push("ess.effective_to <= ?");
    values.push(filters.effective_to_lte);
  }

  // 8. Created By
  if (filters.created_by) {
    conditions.push("ess.created_by = ?");
    values.push(filters.created_by);
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
  if (filters.school_id) {
    display.school_id = filters.school_id;
  }
  if (filters.employee_id) {
    display.employee_id = filters.employee_id;
  }
  if (filters.structure_name) {
    display.structure_name = filters.structure_name;
  }
  if (filters.status) {
    display.status = filters.status;
  }
  if (filters.effective_from) {
    display.effective_from = filters.effective_from;
  }
  if (filters.effective_from_gte) {
    display.effective_from_gte = filters.effective_from_gte;
  }
  if (filters.effective_from_lte) {
    display.effective_from_lte = filters.effective_from_lte;
  }
  if (filters.effective_to) {
    display.effective_to = filters.effective_to;
  }
  if (filters.effective_to_gte) {
    display.effective_to_gte = filters.effective_to_gte;
  }
  if (filters.effective_to_lte) {
    display.effective_to_lte = filters.effective_to_lte;
  }
  if (filters.created_by) {
    display.created_by = filters.created_by;
  }
  if (filters.sort_by || filters.sortBy) {
    display.sorted_by = `${filters.sort_by || filters.sortBy} (${String(filters.sort_order || filters.sortOrder || "DESC").toUpperCase()})`;
  }
  return display;
};

/* =================================================================
   CREATE SALARY STRUCTURE
================================================================= */
export const createSalaryStructure = async (data, user) => {
  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    await conn.beginTransaction();

    // 1. Get employee
    const [[employee]] = await conn.query(
      `SELECT id, school_id, designation, first_name, last_name, employee_code 
       FROM employees 
       WHERE id = ?`,
      [validated.employee_id],
    );

    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    // 2. AUTO school_id
    validated.school_id = employee.school_id;

    // 3. AUTO created_by from token
    validated.created_by = user.id;

    // 4. AUTO structure_name
    const year = new Date(validated.effective_from).getFullYear();
    validated.structure_name = `${
      employee.designation || "Employee"
    } Salary ${year}`;

    // 5. Prevent overlapping active structure
    if (validated.status === "active") {
      const overlap = await checkActiveStructureOverlap(
        conn,
        validated.employee_id,
        validated.effective_from,
        validated.effective_to,
      );

      if (overlap.length > 0) {
        throw {
          status: 409,
          message: "Active salary structure already exists for this date range",
        };
      }
    }

    // 6. Insert
    const id = await SalaryStructureModel.create(conn, validated);
    const created = await SalaryStructureModel.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Salary structure created successfully",
      id,
      data: created,
      salaryStructure: created,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE SALARY STRUCTURE
================================================================= */
export const updateSalaryStructure = async (id, data, user = null) => {
  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdate(data);

    await conn.beginTransaction();

    const existing = await SalaryStructureModel.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Salary structure not found" };
    }

    const targetStatus =
      validated.status !== undefined ? validated.status : existing.status;
    const targetFrom =
      validated.effective_from !== undefined
        ? validated.effective_from
        : existing.effective_from;
    const targetTo =
      validated.effective_to !== undefined
        ? validated.effective_to
        : existing.effective_to;

    // Check overlap if active
    if (targetStatus === "active") {
      const overlap = await checkActiveStructureOverlap(
        conn,
        existing.employee_id,
        targetFrom,
        targetTo,
        id,
      );

      if (overlap.length > 0) {
        throw {
          status: 409,
          message: "Active salary structure already exists for this date range",
        };
      }
    }

    await SalaryStructureModel.update(conn, id, validated);
    const updated = await SalaryStructureModel.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Salary structure updated successfully",
      id: Number(id),
      old_data: existing,
      new_data: updated,
      data: updated,
      salaryStructure: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE SALARY STRUCTURE STATUS
================================================================= */
export const updateSalaryStructureStatus = async (id, status, user = null) => {
  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const cleanStatus = validateSalaryStructureStatus(status);

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await SalaryStructureModel.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Salary structure not found" };
    }

    if (existing.status === cleanStatus) {
      await conn.rollback();
      return {
        success: true,
        message: `Salary structure is already ${cleanStatus}`,
        id: Number(id),
        status: cleanStatus,
        oldSalaryStructure: existing,
        updatedSalaryStructure: existing,
        data: existing,
      };
    }

    // If activating, check overlap with existing active structures
    if (cleanStatus === "active") {
      const overlap = await checkActiveStructureOverlap(
        conn,
        existing.employee_id,
        existing.effective_from,
        existing.effective_to,
        id,
      );

      if (overlap.length > 0) {
        throw {
          status: 409,
          message:
            "Cannot activate salary structure: an active structure already overlaps with these dates",
        };
      }
    }

    await SalaryStructureModel.updateStatus(conn, id, cleanStatus);
    const updated = await SalaryStructureModel.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: `Salary structure status updated to ${cleanStatus}`,
      id: Number(id),
      status: cleanStatus,
      oldSalaryStructure: existing,
      updatedSalaryStructure: updated,
      data: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   DELETE SALARY STRUCTURE
================================================================= */
export const deleteSalaryStructure = async (id, user = null) => {
  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await SalaryStructureModel.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Salary structure not found" };
    }

    if (existing.status === "active") {
      throw {
        status: 400,
        message: "Cannot delete active salary structure",
      };
    }

    // Safety checks against referencing records
    const detailsCount = await SalaryStructureModel.countDetails(conn, id);
    if (detailsCount > 0) {
      throw {
        status: 400,
        message: `Cannot delete salary structure '${existing.structure_name}'. It contains ${detailsCount} structure detail(s). Please remove all associated structure details first.`,
      };
    }

    const payrollCount = await SalaryStructureModel.countPayrollReferences(conn, id);
    if (payrollCount > 0) {
      throw {
        status: 400,
        message: `Cannot delete salary structure '${existing.structure_name}'. It is currently linked to ${payrollCount} employee payroll record(s).`,
      };
    }

    await SalaryStructureModel.delete(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Deleted successfully",
      deletedSalaryStructure: existing,
      data: existing,
    };
  } catch (err) {
    await conn.rollback();
    if (
      err.code === "ER_ROW_IS_REFERENCED_2" ||
      err.errno === 1451 ||
      (err.message && err.message.includes("foreign key constraint fails"))
    ) {
      throw {
        status: 400,
        message:
          "Cannot delete this salary structure because it is linked to existing structure details or payroll records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   GET SALARY STRUCTURE BY ID
================================================================= */
export const getSalaryStructureById = async (id) => {
  if (!id) {
    throw { status: 400, message: "id required" };
  }

  const db = getDB();
  const row = await SalaryStructureModel.findById(db, id);

  if (!row) {
    throw { status: 404, message: "Salary structure not found" };
  }

  return row;
};

/* =================================================================
   GET ALL SALARY STRUCTURES (FILTERS & PAGINATION)
================================================================= */
export const getAllSalaryStructures = async (query = {}) => {
  const db = getDB();

  const filters = validateSalaryStructureFilters(query);
  const { whereClause, values } = buildSalaryStructureFilterClauses(filters);
  const total = await SalaryStructureModel.countWithFilters(db, {
    whereClause,
    values: [...values],
  });

  const sortBy = String(filters.sort_by || filters.sortBy || "id").toLowerCase();
  const sortOrder = String(
    filters.sort_order || filters.sortOrder || filters.order || "DESC",
  ).toUpperCase();
  const validOrder = sortOrder === "ASC" ? "ASC" : "DESC";

  let orderClause = "ORDER BY ess.id DESC";
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

  const rows = await SalaryStructureModel.findWithFilters(db, {
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
   GET SALARY STRUCTURES BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getAllSalaryStructuresByToken = async (user, query = {}) => {
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

  return await getAllSalaryStructures(scopedFilters);
};
