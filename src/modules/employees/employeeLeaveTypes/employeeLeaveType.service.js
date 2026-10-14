import { getDB } from "../../../config/db.js";
import {
  validateCreate,
  validateUpdate,
  validateLeaveTypeStatus,
  validateLeaveTypeFilters,
} from "./employeeLeaveType.validation.js";
import { Model } from "./employeeLeaveType.model.js";
import { SchoolModel } from "../../schools/school.model.js";

const ALLOWED_SORT_FIELDS = {
  id: "elt.id",
  name: "elt.name",
  code: "elt.code",
  days_per_year: "elt.days_per_year",
  max_days_per_request: "elt.max_days_per_request",
  is_paid: "elt.is_paid",
  carry_forward: "elt.carry_forward",
  max_carry_forward_days: "elt.max_carry_forward_days",
  allow_half_day: "elt.allow_half_day",
  requires_approval: "elt.requires_approval",
  requires_attachment: "elt.requires_attachment",
  applicable_gender: "elt.applicable_gender",
  status: "elt.status",
  school_id: "elt.school_id",
  created_by: "elt.created_by",
  updated_by: "elt.updated_by",
  created_at: "elt.created_at",
  updated_at: "elt.updated_at",
};

/* =================================================================
   BUILD FILTER CLAUSES
================================================================= */
export const buildLeaveTypeFilterClauses = (filters = {}) => {
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
        `elt.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`elt.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("elt.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 2. Global Search (name, code, description, or school_name)
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      elt.name LIKE ? OR
      elt.code LIKE ? OR
      elt.description LIKE ? OR
      sc.name LIKE ?
    )`);
    values.push(term, term, term, term);
  }

  // 3. Name (exact or partial)
  if (filters.name) {
    conditions.push("elt.name LIKE ?");
    values.push(`%${String(filters.name).trim()}%`);
  }

  // 4. Code (exact or partial)
  if (filters.code) {
    conditions.push("elt.code LIKE ?");
    values.push(`%${String(filters.code).trim()}%`);
  }

  // 5. Status (single or comma-separated)
  if (filters.status) {
    const statuses = String(filters.status)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length === 1) {
      conditions.push("elt.status = ?");
      values.push(statuses[0]);
    } else if (statuses.length > 1) {
      conditions.push(`elt.status IN (${statuses.map(() => "?").join(",")})`);
      values.push(...statuses);
    }
  }

  // 6. Applicable Gender
  if (filters.applicable_gender) {
    conditions.push("elt.applicable_gender = ?");
    values.push(filters.applicable_gender);
  }

  // 7. Boolean flags
  if (filters.is_paid !== undefined && filters.is_paid !== null) {
    conditions.push("elt.is_paid = ?");
    values.push(filters.is_paid ? 1 : 0);
  }

  if (filters.carry_forward !== undefined && filters.carry_forward !== null) {
    conditions.push("elt.carry_forward = ?");
    values.push(filters.carry_forward ? 1 : 0);
  }

  if (filters.requires_approval !== undefined && filters.requires_approval !== null) {
    conditions.push("elt.requires_approval = ?");
    values.push(filters.requires_approval ? 1 : 0);
  }

  if (filters.requires_attachment !== undefined && filters.requires_attachment !== null) {
    conditions.push("elt.requires_attachment = ?");
    values.push(filters.requires_attachment ? 1 : 0);
  }

  if (filters.allow_half_day !== undefined && filters.allow_half_day !== null) {
    conditions.push("elt.allow_half_day = ?");
    values.push(filters.allow_half_day ? 1 : 0);
  }

  // 8. Created By (exact, comma-separated, or array)
  if (
    filters.created_by !== undefined &&
    filters.created_by !== null &&
    filters.created_by !== ""
  ) {
    if (Array.isArray(filters.created_by)) {
      conditions.push(
        `elt.created_by IN (${filters.created_by.map(() => "?").join(",")})`,
      );
      values.push(...filters.created_by);
    } else if (String(filters.created_by).includes(",")) {
      const ids = String(filters.created_by)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`elt.created_by IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("elt.created_by = ?");
      values.push(filters.created_by);
    }
  }

  // 9. Updated By (exact, comma-separated, or array)
  if (
    filters.updated_by !== undefined &&
    filters.updated_by !== null &&
    filters.updated_by !== ""
  ) {
    if (Array.isArray(filters.updated_by)) {
      conditions.push(
        `elt.updated_by IN (${filters.updated_by.map(() => "?").join(",")})`,
      );
      values.push(...filters.updated_by);
    } else if (String(filters.updated_by).includes(",")) {
      const ids = String(filters.updated_by)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`elt.updated_by IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("elt.updated_by = ?");
      values.push(filters.updated_by);
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
  if (filters.status) {
    display.status = filters.status;
  }
  if (filters.applicable_gender) {
    display.applicable_gender = filters.applicable_gender;
  }
  if (filters.is_paid !== undefined) {
    display.is_paid = filters.is_paid;
  }
  if (filters.carry_forward !== undefined) {
    display.carry_forward = filters.carry_forward;
  }
  if (filters.created_by) {
    display.created_by = filters.created_by;
  }
  if (filters.updated_by) {
    display.updated_by = filters.updated_by;
  }
  if (filters.sort_by || filters.sortBy) {
    display.sorted_by = `${filters.sort_by || filters.sortBy} (${String(filters.sort_order || filters.sortOrder || "DESC").toUpperCase()})`;
  }
  return display;
};

/* =================================================================
   CREATE LEAVE TYPE
================================================================= */
export const createLeaveType = async (data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreate(data);

    // If created_by wasn't explicitly supplied, fall back to current authenticated user
    if (!validated.created_by && user?.id) {
      const uId = Number(user.id);
      if (!isNaN(uId) && Number.isInteger(uId) && uId > 0) {
        validated.created_by = uId;
      }
    }

    await conn.beginTransaction();

    // 1. Check school exists
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
      throw { status: 409, message: "Leave type code already exists in this school" };
    }

    // 3. Duplicate name check
    const existsName = await Model.findDuplicateName(
      conn,
      validated.school_id,
      validated.name,
    );

    if (existsName) {
      throw { status: 409, message: "Leave type name already exists in this school" };
    }

    const id = await Model.create(conn, validated);
    const created = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Leave type created successfully",
      id,
      data: created,
      leaveType: created,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE LEAVE TYPE
================================================================= */
export const updateLeaveType = async (id, data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Leave type not found" };
    }

    const validated = validateUpdate(data);

    // If updated_by was not provided in data, fall back to current authenticated user
    if (validated.updated_by === undefined || validated.updated_by === null) {
      if (user?.id) {
        const uId = Number(user.id);
        if (!isNaN(uId) && Number.isInteger(uId) && uId > 0) {
          validated.updated_by = uId;
        }
      }
    }

    const targetSchoolId =
      validated.school_id !== undefined ? validated.school_id : existing.school_id;

    await conn.beginTransaction();

    // Check duplicate code
    if (validated.code) {
      const dupCode = await Model.findDuplicate(
        conn,
        targetSchoolId,
        validated.code,
        id,
      );

      if (dupCode) {
        throw { status: 409, message: "Leave type code already exists in this school" };
      }
    }

    // Check duplicate name
    if (validated.name) {
      const dupName = await Model.findDuplicateName(
        conn,
        targetSchoolId,
        validated.name,
        id,
      );

      if (dupName) {
        throw { status: 409, message: "Leave type name already exists in this school" };
      }
    }

    // Merge existing + new for cross-field business validation
    const finalData = {
      ...existing,
      ...validated,
    };

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
      throw { status: 400, message: "days_per_year cannot exceed 365" };
    }

    await Model.update(conn, id, validated);
    const updated = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Leave type updated successfully",
      id,
      old_data: existing,
      new_data: updated,
      oldLeaveType: existing,
      updatedLeaveType: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE LEAVE TYPE STATUS
================================================================= */
export const updateLeaveTypeStatus = async (id, status, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };
    const validatedStatus = validateLeaveTypeStatus(status);

    await conn.beginTransaction();

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Leave type not found" };
    }

    const updatePayload = { status: validatedStatus };
    if (user?.id) {
      const uId = Number(user.id);
      if (!isNaN(uId) && Number.isInteger(uId) && uId > 0) {
        updatePayload.updated_by = uId;
      }
    }

    await Model.update(conn, id, updatePayload);
    const updated = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: `Leave type status updated to '${validatedStatus}'`,
      id,
      oldLeaveType: existing,
      updatedLeaveType: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   DELETE LEAVE TYPE
================================================================= */
export const deleteLeaveType = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Leave type not found" };
    }

    await Model.delete(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Leave type deleted successfully",
      id,
      deletedLeaveType: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   GET ALL LEAVE TYPES (WITH ADVANCED FILTERS & PAGINATION)
================================================================= */
export const getAllLeaveTypes = async (query = {}) => {
  const db = getDB();

  try {
    const filters = validateLeaveTypeFilters(query);
    const { whereClause, values } = buildLeaveTypeFilterClauses(filters);
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

    let orderClause = "ORDER BY elt.id DESC";
    if (sortBy === "name") {
      orderClause = `ORDER BY elt.name ${validOrder}`;
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
   GET ALL LEAVE TYPES BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getAllLeaveTypesByToken = async (user, query = {}) => {
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

  return await getAllLeaveTypes(scopedFilters);
};

/* =================================================================
   GET LEAVE TYPE BY ID
================================================================= */
export const getLeaveTypeById = async (id) => {
  if (!id) throw { status: 400, message: "ID required" };
  const db = getDB();

  const row = await Model.findById(db, id);

  if (!row) {
    throw { status: 404, message: "Leave type not found" };
  }

  return row;
};

/* =================================================================
   CHECK EXISTING LEAVE TYPE (FOR REALTIME VALIDATION)
================================================================= */
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
  const values = [Number(school_id)];

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
