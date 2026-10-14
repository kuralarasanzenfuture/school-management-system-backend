import { getDB } from "../../config/db.js";
import { EmployeeShiftModel as Model } from "./employeeShift.model.js";
import {
  validateCreateShift,
  validateUpdateShift,
  validateShiftStatus,
  validateShiftFilters,
} from "./employeeShift.validation.js";

const ALLOWED_SORT_FIELDS = {
  id: "es.id",
  name: "es.name",
  shift_type: "es.shift_type",
  start_time: "es.start_time",
  end_time: "es.end_time",
  working_hours: "es.working_hours",
  grace_minutes: "es.grace_minutes",
  is_default: "es.is_default",
  status: "es.status",
  created_by: "es.created_by",
  updated_by: "es.updated_by",
  created_at: "es.created_at",
  updated_at: "es.updated_at",
  school_id: "es.school_id",
};

/* =================================================================
   BUILD FILTER CLAUSES
================================================================= */
export const buildShiftFilterClauses = (filters = {}) => {
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
        `es.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`es.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("es.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 2. Global Search (name or school_name)
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      es.name LIKE ? OR
      sc.name LIKE ?
    )`);
    values.push(term, term);
  }

  // 3. Name (exact or partial)
  if (filters.name) {
    conditions.push("es.name LIKE ?");
    values.push(`%${String(filters.name).trim()}%`);
  }

  // 4. Shift Type
  if (filters.shift_type) {
    conditions.push("es.shift_type = ?");
    values.push(filters.shift_type);
  }

  // 5. Status (single or comma-separated)
  if (filters.status) {
    const statuses = String(filters.status)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length === 1) {
      conditions.push("es.status = ?");
      values.push(statuses[0]);
    } else if (statuses.length > 1) {
      conditions.push(`es.status IN (${statuses.map(() => "?").join(",")})`);
      values.push(...statuses);
    }
  }

  // 6. Is Default
  if (filters.is_default !== undefined && filters.is_default !== null) {
    conditions.push("es.is_default = ?");
    values.push(filters.is_default ? 1 : 0);
  }

  // 7. Created By (exact, comma-separated, or array)
  if (
    filters.created_by !== undefined &&
    filters.created_by !== null &&
    filters.created_by !== ""
  ) {
    if (Array.isArray(filters.created_by)) {
      conditions.push(
        `es.created_by IN (${filters.created_by.map(() => "?").join(",")})`,
      );
      values.push(...filters.created_by);
    } else if (String(filters.created_by).includes(",")) {
      const ids = String(filters.created_by)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`es.created_by IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("es.created_by = ?");
      values.push(filters.created_by);
    }
  }

  // 8. Updated By (exact, comma-separated, or array)
  if (
    filters.updated_by !== undefined &&
    filters.updated_by !== null &&
    filters.updated_by !== ""
  ) {
    if (Array.isArray(filters.updated_by)) {
      conditions.push(
        `es.updated_by IN (${filters.updated_by.map(() => "?").join(",")})`,
      );
      values.push(...filters.updated_by);
    } else if (String(filters.updated_by).includes(",")) {
      const ids = String(filters.updated_by)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`es.updated_by IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("es.updated_by = ?");
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
  if (filters.shift_type) {
    display.shift_type = filters.shift_type;
  }
  if (filters.status) {
    display.status = filters.status;
  }
  if (filters.is_default !== undefined) {
    display.is_default = filters.is_default;
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
   CREATE SHIFT
================================================================= */
export const createShift = async (data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateShift(data);

    // If created_by wasn't explicitly supplied, fall back to current authenticated user
    if (!validated.created_by && user?.id) {
      const uId = Number(user.id);
      if (!isNaN(uId) && Number.isInteger(uId) && uId > 0) {
        validated.created_by = uId;
      }
    }

    await conn.beginTransaction();

    const exists = await Model.findDuplicate(
      conn,
      validated.school_id,
      validated.name,
    );

    if (exists) {
      throw { status: 409, message: "Shift already exists in this school" };
    }

    const id = await Model.create(conn, validated);
    const created = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Shift created successfully",
      id,
      data: created,
      shift: created,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE SHIFT
================================================================= */
export const updateShift = async (id, data, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Shift not found" };
    }

    const validated = validateUpdateShift(data, existing);

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

    if (validated.name) {
      const dup = await Model.findDuplicate(
        conn,
        targetSchoolId,
        validated.name,
        id,
      );

      if (dup) {
        throw { status: 409, message: "Shift already exists in this school" };
      }
    }

    await conn.beginTransaction();

    await Model.update(conn, id, validated);
    const updated = await Model.findById(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Shift updated successfully",
      id,
      old_data: existing,
      new_data: updated,
      oldShift: existing,
      updatedShift: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   UPDATE SHIFT STATUS
================================================================= */
export const updateShiftStatus = async (id, status, user = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };
    const validatedStatus = validateShiftStatus(status);

    await conn.beginTransaction();

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Shift not found" };
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
      message: `Shift status updated to '${validatedStatus}'`,
      id,
      oldShift: existing,
      updatedShift: updated,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   DELETE SHIFT
================================================================= */
export const deleteShift = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Shift not found" };
    }

    await Model.delete(conn, id);

    await conn.commit();

    return {
      success: true,
      message: "Shift deleted successfully",
      id,
      deletedShift: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =================================================================
   GET ALL SHIFTS (WITH ADVANCED FILTERS & PAGINATION)
================================================================= */
export const getAllShifts = async (query = {}) => {
  const db = getDB();

  try {
    const filters = validateShiftFilters(query);
    const { whereClause, values } = buildShiftFilterClauses(filters);
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

    let orderClause = "ORDER BY es.id DESC";
    if (sortBy === "name") {
      orderClause = `ORDER BY es.name ${validOrder}`;
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
   GET ALL SHIFTS BY TOKEN (SCHOOL-SCOPED)
================================================================= */
export const getAllShiftsByToken = async (user, query = {}) => {
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

  return await getAllShifts(scopedFilters);
};

/* =================================================================
   GET SHIFT BY ID
================================================================= */
export const getShiftById = async (id) => {
  if (!id) throw { status: 400, message: "ID required" };
  const db = getDB();

  const row = await Model.findById(db, id);

  if (!row) {
    throw { status: 404, message: "Shift not found" };
  }

  return row;
};
