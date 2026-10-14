import { getDB } from "../../../config/db.js";
import { EmployeeDesignationModel } from "./employee_designations.model.js";
import {
  validateCreateDesignation,
  validateUpdateDesignation,
  validateDesignationStatus,
  validateDesignationFilters,
} from "./employee_designations.validation.js";

const ALLOWED_SORT_FIELDS = {
  id: "d.id",
  name: "d.name",
  status: "d.status",
  school_id: "d.school_id",
  description: "d.description",
  created_at: "d.created_at",
  updated_at: "d.updated_at",
};

/* =================================================================
   BUILD FILTER CLAUSES
================================================================= */
export const buildDesignationFilterClauses = (filters = {}) => {
  const conditions = [];
  const values = [];

  // 1. School ID (exact or comma-separated list or array)
  if (
    filters.school_id !== undefined &&
    filters.school_id !== null &&
    filters.school_id !== ""
  ) {
    if (Array.isArray(filters.school_id)) {
      conditions.push(
        `d.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`d.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("d.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 2. Global Search (name or description or school_name)
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      d.name LIKE ? OR
      d.description LIKE ? OR
      s.name LIKE ?
    )`);
    values.push(term, term, term);
  }

  // 3. Name (exact or partial)
  if (filters.name) {
    conditions.push("d.name LIKE ?");
    values.push(`%${String(filters.name).trim()}%`);
  }

  // 4. Status (single or comma-separated)
  if (filters.status) {
    const statuses = String(filters.status)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length === 1) {
      conditions.push("d.status = ?");
      values.push(statuses[0]);
    } else if (statuses.length > 1) {
      conditions.push(`d.status IN (${statuses.map(() => "?").join(",")})`);
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
  if (filters.status) {
    display.status = filters.status;
  }
  if (filters.sort_by || filters.sortBy) {
    display.sorted_by = `${filters.sort_by || filters.sortBy} (${String(filters.sort_order || filters.sortOrder || "DESC").toUpperCase()})`;
  }
  return display;
};

/* =================================================================
   CREATE DESIGNATION
================================================================= */
export const createDesignation = async (data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateDesignation(data);
    if (user?.id) {
      validated.created_by = user.id;
    }

    await conn.beginTransaction();

    const [[exists]] = await conn.query(
      `
      SELECT id 
      FROM employee_designations 
      WHERE name = ? 
        AND school_id = ?
      `,
      [validated.name, validated.school_id],
    );

    if (exists) {
      throw { status: 409, message: "Designation already exists in this school" };
    }

    const id = await EmployeeDesignationModel.create(conn, validated);
    const created = await EmployeeDesignationModel.findById(id, conn);

    await conn.commit();

    return {
      success: true,
      message: "Designation created successfully",
      id,
      data: created,
      designation: created,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE DESIGNATION
================================================================= */
export const updateDesignation = async (id, data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const validated = validateUpdateDesignation(data);
    if (user?.id) {
      validated.updated_by = user.id;
    }

    await conn.beginTransaction();

    const existing = await EmployeeDesignationModel.findById(id, conn);

    if (!existing) {
      throw { status: 404, message: "Designation not found" };
    }

    const targetSchoolId =
      validated.school_id !== undefined ? validated.school_id : existing.school_id;

    if (validated.name) {
      const [[exists]] = await conn.query(
        `
        SELECT id 
        FROM employee_designations 
        WHERE name = ? 
          AND school_id = ? 
          AND id != ?
        `,
        [validated.name, targetSchoolId, id],
      );

      if (exists) {
        throw { status: 409, message: "Designation already exists in this school" };
      }
    }

    await EmployeeDesignationModel.update(conn, id, validated);
    const updated = await EmployeeDesignationModel.findById(id, conn);

    await conn.commit();

    return {
      success: true,
      message: "Designation updated successfully",
      id,
      old_data: existing,
      new_data: updated,
      oldDesignation: existing,
      updatedDesignation: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE DESIGNATION STATUS
================================================================= */
export const updateDesignationStatus = async (id, status, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };
    const validatedStatus = validateDesignationStatus(status);

    await conn.beginTransaction();

    const existing = await EmployeeDesignationModel.findById(id, conn);
    if (!existing) {
      throw { status: 404, message: "Designation not found" };
    }

    const updatePayload = { status: validatedStatus };
    if (user?.id) {
      updatePayload.updated_by = user.id;
    }

    await EmployeeDesignationModel.update(conn, id, updatePayload);
    const updated = await EmployeeDesignationModel.findById(id, conn);

    await conn.commit();

    return {
      success: true,
      message: `Designation status updated to '${validatedStatus}'`,
      id,
      oldDesignation: existing,
      updatedDesignation: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   DELETE DESIGNATION
================================================================= */
export const deleteDesignation = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await EmployeeDesignationModel.findById(id, conn);

    if (!existing) {
      throw { status: 404, message: "Designation not found" };
    }

    // Safety check: ensure designation is not currently assigned to employees
    const [[assignedEmployees]] = await conn.query(
      `SELECT COUNT(*) AS count FROM employees WHERE designation = ? AND school_id = ?`,
      [existing.name, existing.school_id],
    );

    if (assignedEmployees?.count > 0) {
      throw {
        status: 409,
        message: `Cannot delete designation. It is currently assigned to ${assignedEmployees.count} employee(s).`,
      };
    }

    await EmployeeDesignationModel.delete(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Designation deleted successfully",
      id,
      deletedDesignation: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   GET ALL DESIGNATIONS (WITH ADVANCED FILTERS & PAGINATION)
================================================================= */
export const getAllDesignations = async (query = {}) => {
  const db = getDB();

  try {
    // If query is passed as a number or string (legacy backward compatibility)
    const normalizedQuery =
      typeof query === "number" || typeof query === "string"
        ? { school_id: query }
        : query || {};

    const filters = validateDesignationFilters(normalizedQuery);
    const { whereClause, values } = buildDesignationFilterClauses(filters);
    const total = await EmployeeDesignationModel.countWithFilters(db, {
      whereClause,
      values: [...values],
    });

    // Sorting
    const sortBy = String(
      filters.sort_by || filters.sortBy || "id",
    ).toLowerCase();
    const sortOrder = String(
      filters.sort_order || filters.sortOrder || filters.order || "DESC",
    ).toUpperCase();
    const validOrder = sortOrder === "ASC" ? "ASC" : "DESC";

    let orderClause = "ORDER BY d.id DESC";
    if (sortBy === "name") {
      orderClause = `ORDER BY d.name ${validOrder}`;
    } else if (ALLOWED_SORT_FIELDS[sortBy]) {
      orderClause = `ORDER BY ${ALLOWED_SORT_FIELDS[sortBy]} ${validOrder}`;
    }

    // Pagination
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

    const rows = await EmployeeDesignationModel.findWithFilters(db, {
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
   GET ALL DESIGNATIONS BY TOKEN (SCOPED TO USER'S SCHOOL)
================================================================= */
export const getAllDesignationsByToken = async (user, query = {}) => {
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

  return await getAllDesignations(scopedFilters);
};

/* =================================================================
   GET DESIGNATION BY ID
================================================================= */
export const getDesignationById = async (id) => {
  if (!id) throw { status: 400, message: "ID is required" };
  const designation = await EmployeeDesignationModel.findById(id);
  if (!designation) {
    throw { status: 404, message: "Designation not found" };
  }
  return designation;
};
