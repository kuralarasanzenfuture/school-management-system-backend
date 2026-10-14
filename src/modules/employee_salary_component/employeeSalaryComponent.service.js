import { getDB } from "../../config/db.js";
import { ComponentModel as Model } from "./employeeSalaryComponent.model.js";
import {
  validateCreate,
  validateUpdate,
  validateSalaryComponentStatus,
  validateSalaryComponentFilters,
} from "./employeeSalaryComponent.validation.js";
import { SchoolModel } from "../schools/school.model.js";

const ALLOWED_SORT_FIELDS = {
  id: "esc.id",
  name: "esc.name",
  code: "esc.code",
  component_type: "esc.component_type",
  calculation_type: "esc.calculation_type",
  status: "esc.status",
  school_id: "esc.school_id",
  created_at: "esc.created_at",
  updated_at: "esc.updated_at",
};

/* =================================================================
   BUILD FILTER CLAUSES
================================================================= */
export const buildSalaryComponentFilterClauses = (filters = {}) => {
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
        `esc.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`esc.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("esc.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 2. Global Search (name, code, or school_name)
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      esc.name LIKE ? OR
      esc.code LIKE ? OR
      sc.name LIKE ?
    )`);
    values.push(term, term, term);
  }

  // 3. Name (exact or partial)
  if (filters.name) {
    conditions.push("esc.name LIKE ?");
    values.push(`%${String(filters.name).trim()}%`);
  }

  // 4. Code (exact or partial)
  if (filters.code) {
    conditions.push("esc.code LIKE ?");
    values.push(`%${String(filters.code).trim()}%`);
  }

  // 5. Component Type (single or comma-separated)
  if (filters.component_type) {
    const types = String(filters.component_type)
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (types.length === 1) {
      conditions.push("esc.component_type = ?");
      values.push(types[0]);
    } else if (types.length > 1) {
      conditions.push(`esc.component_type IN (${types.map(() => "?").join(",")})`);
      values.push(...types);
    }
  }

  // 6. Calculation Type (single or comma-separated)
  if (filters.calculation_type) {
    const calcTypes = String(filters.calculation_type)
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    if (calcTypes.length === 1) {
      conditions.push("esc.calculation_type = ?");
      values.push(calcTypes[0]);
    } else if (calcTypes.length > 1) {
      conditions.push(`esc.calculation_type IN (${calcTypes.map(() => "?").join(",")})`);
      values.push(...calcTypes);
    }
  }

  // 7. Status (single or comma-separated)
  if (filters.status) {
    const statuses = String(filters.status)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length === 1) {
      conditions.push("esc.status = ?");
      values.push(statuses[0]);
    } else if (statuses.length > 1) {
      conditions.push(`esc.status IN (${statuses.map(() => "?").join(",")})`);
      values.push(...statuses);
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, values };
};

export const buildFilterDisplay = (filters = {}) => {
  const display = {};
  if (filters.search || filters.q) {
    display.search = String(filters.search || filters.q).trim();
  }
  if (filters.school_id) {
    display.school_id = filters.school_id;
  }
  if (filters.name) {
    display.name = filters.name;
  }
  if (filters.code) {
    display.code = filters.code;
  }
  if (filters.component_type) {
    display.component_type = filters.component_type;
  }
  if (filters.calculation_type) {
    display.calculation_type = filters.calculation_type;
  }
  if (filters.status) {
    display.status = filters.status;
  }
  if (filters.sort_by || filters.sortBy) {
    display.sorted_by = `${filters.sort_by || filters.sortBy} (${String(filters.sort_order || filters.sortOrder || "DESC").toUpperCase()})`;
  }
  return display;
};

/* =================================================================
   CREATE SALARY COMPONENT
================================================================= */
export const createComponent = async (data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    await conn.beginTransaction();

    // 1. School exists check
    const schoolExists = await SchoolModel.existsById(
      conn,
      validated.school_id,
    );
    if (!schoolExists) {
      throw { status: 400, message: "Invalid school_id" };
    }

    // 2. Duplicate code check
    const existsCode = await Model.findDuplicate(
      conn,
      validated.school_id,
      validated.code,
    );

    if (existsCode) {
      throw { status: 409, message: "Salary component code already exists in this school" };
    }

    // 3. Duplicate name check
    const existsName = await Model.findDuplicateName(
      conn,
      validated.school_id,
      validated.name,
    );

    if (existsName) {
      throw { status: 409, message: "Salary component name already exists in this school" };
    }

    const id = await Model.create(conn, validated);
    const created = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Salary component created successfully",
      id,
      data: created,
      component: created,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE SALARY COMPONENT
================================================================= */
export const updateComponent = async (id, data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Salary component not found" };
    }

    const validated = validateUpdate(data);

    const targetSchoolId =
      validated.school_id !== undefined ? validated.school_id : existing.school_id;

    await conn.beginTransaction();

    if (validated.code) {
      const dupCode = await Model.findDuplicate(
        conn,
        targetSchoolId,
        validated.code,
        id,
      );

      if (dupCode) {
        throw { status: 409, message: "Salary component code already exists in this school" };
      }
    }

    if (validated.name) {
      const dupName = await Model.findDuplicateName(
        conn,
        targetSchoolId,
        validated.name,
        id,
      );

      if (dupName) {
        throw { status: 409, message: "Salary component name already exists in this school" };
      }
    }

    await Model.update(conn, id, validated);
    const updated = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Salary component updated successfully",
      id,
      old_data: existing,
      new_data: updated,
      oldComponent: existing,
      updatedComponent: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE SALARY COMPONENT STATUS
================================================================= */
export const updateComponentStatus = async (id, status, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };
    const validatedStatus = validateSalaryComponentStatus(status);

    await conn.beginTransaction();

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Salary component not found" };
    }

    await Model.update(conn, id, { status: validatedStatus });
    const updated = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: `Salary component status updated to '${validatedStatus}'`,
      id,
      oldComponent: existing,
      updatedComponent: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   DELETE SALARY COMPONENT
================================================================= */
export const deleteComponent = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Salary component not found" };
    }

    await Model.delete(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Salary component deleted successfully",
      id,
      deletedComponent: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   GET ALL SALARY COMPONENTS (FILTERS & PAGINATION)
================================================================= */
export const getAllComponents = async (query = {}) => {
  const db = getDB();

  try {
    const filters = validateSalaryComponentFilters(query);
    const { whereClause, values } = buildSalaryComponentFilterClauses(filters);
    const total = await Model.countWithFilters(db, {
      whereClause,
      values: [...values],
    });

    const sortBy = String(
      filters.sort_by || filters.sortBy || "id",
    ).toLowerCase();
    const sortOrder = String(
      filters.sort_order || filters.sortOrder || filters.order || "DESC",
    ).toUpperCase();
    const validOrder = sortOrder === "ASC" ? "ASC" : "DESC";

    let orderClause = "ORDER BY esc.id DESC";
    if (sortBy === "name") {
      orderClause = `ORDER BY esc.name ${validOrder}`;
    } else if (ALLOWED_SORT_FIELDS[sortBy]) {
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

    const rows = await Model.findWithFilters(db, {
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
  } catch (err) {
    throw err;
  }
};

/* =================================================================
   GET SALARY COMPONENTS BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getComponentsByToken = async (user, query = {}) => {
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
    user.role === "admin";

  const scopedFilters = { ...query };

  // Non-admins are locked to their own school
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    scopedFilters.school_id = dbUser.school_id;
  }

  return await getAllComponents(scopedFilters);
};

/* =================================================================
   GET SALARY COMPONENT BY ID
================================================================= */
export const getComponentById = async (id) => {
  if (!id) throw { status: 400, message: "ID required" };
  const db = getDB();

  const row = await Model.findById(db, id);

  if (!row) {
    throw { status: 404, message: "Salary component not found" };
  }

  return row;
};

/* =================================================================
   CHECK EXISTING SALARY COMPONENT (REALTIME CONFLICT CHECK)
================================================================= */
export const checkExistingComponent = async (query = {}) => {
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
    FROM employee_salary_components
    WHERE school_id = ?
  `;
  const values = [Number(school_id)];

  const conditions = [];

  if (name) {
    conditions.push("name = ?");
    values.push(String(name).trim().toUpperCase());
  }

  if (code) {
    conditions.push("code = ?");
    values.push(String(code).trim().toUpperCase());
  }

  if (conditions.length) {
    sql += ` AND (${conditions.join(" OR ")})`;
  }

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
