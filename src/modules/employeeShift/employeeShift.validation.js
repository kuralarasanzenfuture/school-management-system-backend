// employeeShift.validation.js

const calculateHours = (start, end, crossesMidnight = false) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let totalMinutes = eh * 60 + em - (sh * 60 + sm);
  if (crossesMidnight || totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  return Math.max(0, Number((totalMinutes / 60).toFixed(2)));
};

const validateBigIntId = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    throw {
      status: 400,
      message: `Invalid ${fieldName}. Must be a valid positive integer`,
    };
  }

  if (num > Number.MAX_SAFE_INTEGER) {
    throw {
      status: 400,
      message: `${fieldName} exceeds maximum allowed value`,
    };
  }

  return num;
};

export const validateCreateShift = (data) => {
  let {
    school_id,
    name,
    shift_type,
    start_time,
    end_time,
    crosses_midnight,
    grace_minutes,
    is_default,
    status,
    created_by,
    updated_by,
  } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name) throw { status: 400, message: "name required" };
  if (!start_time || !end_time) {
    throw { status: 400, message: "start_time & end_time required" };
  }

  const schoolIdNum = Number(school_id);
  if (isNaN(schoolIdNum) || !Number.isInteger(schoolIdNum) || schoolIdNum <= 0) {
    throw { status: 400, message: "Valid school_id required" };
  }

  const cleanCreatedBy = validateBigIntId(created_by, "created_by");
  const cleanUpdatedBy = validateBigIntId(updated_by, "updated_by");

  const isCrossMidnight =
    crosses_midnight === true ||
    crosses_midnight === "true" ||
    crosses_midnight === 1 ||
    crosses_midnight === "1" ||
    start_time > end_time;

  if (!isCrossMidnight && start_time >= end_time) {
    throw {
      status: 400,
      message: "start_time must be less than end_time unless crosses_midnight is enabled",
    };
  }

  const validShiftTypes = ["day", "evening", "night", "flexible"];
  const cleanShiftType = shift_type
    ? String(shift_type).toLowerCase().trim()
    : "day";
  if (!validShiftTypes.includes(cleanShiftType)) {
    throw {
      status: 400,
      message: `Invalid shift_type. Allowed: ${validShiftTypes.join(", ")}`,
    };
  }

  const working_hours = calculateHours(start_time, end_time, isCrossMidnight);

  status = status ? String(status).toLowerCase().trim() : "active";
  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
  }

  return {
    school_id: schoolIdNum,
    name: name.trim().toUpperCase(),
    shift_type: cleanShiftType,
    start_time,
    end_time,
    crosses_midnight: isCrossMidnight ? 1 : 0,
    grace_minutes: grace_minutes !== undefined ? Math.max(0, Number(grace_minutes)) : 10,
    working_hours,
    is_default: is_default === true || is_default === "true" || is_default === 1 || is_default === "1" ? 1 : 0,
    status,
    created_by: cleanCreatedBy,
    updated_by: cleanUpdatedBy,
  };
};

export const validateUpdateShift = (data, existing = null) => {
  const cleaned = {};

  if (data.school_id !== undefined && data.school_id !== null && data.school_id !== "") {
    const sId = Number(data.school_id);
    if (isNaN(sId) || !Number.isInteger(sId) || sId <= 0) {
      throw { status: 400, message: "Valid school_id required" };
    }
    cleaned.school_id = sId;
  }

  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      throw { status: 400, message: "Name cannot be empty" };
    }
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.shift_type !== undefined) {
    const validShiftTypes = ["day", "evening", "night", "flexible"];
    const cleanType = String(data.shift_type).toLowerCase().trim();
    if (!validShiftTypes.includes(cleanType)) {
      throw {
        status: 400,
        message: `Invalid shift_type. Allowed: ${validShiftTypes.join(", ")}`,
      };
    }
    cleaned.shift_type = cleanType;
  }

  const startTime = data.start_time !== undefined ? data.start_time : existing?.start_time;
  const endTime = data.end_time !== undefined ? data.end_time : existing?.end_time;
  const isCross =
    data.crosses_midnight !== undefined
      ? data.crosses_midnight === true || data.crosses_midnight === "true" || data.crosses_midnight === 1
      : existing?.crosses_midnight;

  if (data.start_time !== undefined || data.end_time !== undefined || data.crosses_midnight !== undefined) {
    if (startTime && endTime) {
      if (!isCross && startTime >= endTime) {
        throw {
          status: 400,
          message: "start_time must be less than end_time unless crosses_midnight is enabled",
        };
      }
      if (data.start_time !== undefined) cleaned.start_time = data.start_time;
      if (data.end_time !== undefined) cleaned.end_time = data.end_time;
      if (data.crosses_midnight !== undefined) cleaned.crosses_midnight = isCross ? 1 : 0;
      cleaned.working_hours = calculateHours(startTime, endTime, isCross);
    }
  }

  if (data.grace_minutes !== undefined) {
    cleaned.grace_minutes = Math.max(0, Number(data.grace_minutes));
  }

  if (data.is_default !== undefined) {
    cleaned.is_default =
      data.is_default === true || data.is_default === "true" || data.is_default === 1 ? 1 : 0;
  }

  if (data.status !== undefined) {
    const status = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
    }
    cleaned.status = status;
  }

  if (data.created_by !== undefined) {
    cleaned.created_by = validateBigIntId(data.created_by, "created_by");
  }

  if (data.updated_by !== undefined) {
    cleaned.updated_by = validateBigIntId(data.updated_by, "updated_by");
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

export const validateShiftStatus = (status) => {
  if (!status) {
    throw { status: 400, message: "Status is required" };
  }
  const cleanStatus = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(cleanStatus)) {
    throw {
      status: 400,
      message: "Invalid status. Allowed values: active, inactive",
    };
  }
  return cleanStatus;
};

export const validateShiftFilters = (query = {}) => {
  const allowedSortCols = [
    "id",
    "name",
    "shift_type",
    "start_time",
    "end_time",
    "working_hours",
    "grace_minutes",
    "is_default",
    "status",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
    "school_id",
  ];

  const sortBy = String(query.sort_by || query.sortBy || "id")
    .toLowerCase()
    .trim();
  const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : "id";
  const safeSortOrder =
    String(query.sort_order || query.sortOrder || query.order || "DESC")
      .toUpperCase()
      .trim() === "ASC"
      ? "ASC"
      : "DESC";

  const validStatuses = ["active", "inactive"];
  let safeStatus = null;
  if (query.status) {
    if (Array.isArray(query.status)) {
      const filtered = query.status
        .map((s) => String(s).toLowerCase().trim())
        .filter((s) => validStatuses.includes(s));
      if (filtered.length === 1) safeStatus = filtered[0];
      else if (filtered.length > 1) safeStatus = filtered.join(",");
    } else {
      const s = String(query.status).toLowerCase().trim();
      if (s.includes(",")) {
        const parts = s
          .split(",")
          .map((p) => p.trim())
          .filter((p) => validStatuses.includes(p));
        if (parts.length > 0) safeStatus = parts.join(",");
      } else if (validStatuses.includes(s)) {
        safeStatus = s;
      }
    }
  }

  let safeSchoolId = null;
  if (
    query.school_id !== undefined &&
    query.school_id !== null &&
    query.school_id !== ""
  ) {
    if (Array.isArray(query.school_id)) {
      safeSchoolId = query.school_id
        .map(Number)
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (String(query.school_id).includes(",")) {
      safeSchoolId = String(query.school_id)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (!isNaN(Number(query.school_id)) && Number.isInteger(Number(query.school_id)) && Number(query.school_id) > 0) {
      safeSchoolId = Number(query.school_id);
    }
  }

  let safeCreatedBy = null;
  if (
    query.created_by !== undefined &&
    query.created_by !== null &&
    query.created_by !== ""
  ) {
    if (Array.isArray(query.created_by)) {
      safeCreatedBy = query.created_by
        .map(Number)
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (String(query.created_by).includes(",")) {
      safeCreatedBy = String(query.created_by)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (
      !isNaN(Number(query.created_by)) &&
      Number.isInteger(Number(query.created_by)) &&
      Number(query.created_by) > 0
    ) {
      safeCreatedBy = Number(query.created_by);
    }
  }

  let safeUpdatedBy = null;
  if (
    query.updated_by !== undefined &&
    query.updated_by !== null &&
    query.updated_by !== ""
  ) {
    if (Array.isArray(query.updated_by)) {
      safeUpdatedBy = query.updated_by
        .map(Number)
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (String(query.updated_by).includes(",")) {
      safeUpdatedBy = String(query.updated_by)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (
      !isNaN(Number(query.updated_by)) &&
      Number.isInteger(Number(query.updated_by)) &&
      Number(query.updated_by) > 0
    ) {
      safeUpdatedBy = Number(query.updated_by);
    }
  }

  const isAll =
    query.all === "true" ||
    query.all === true ||
    query.limit === "all" ||
    Number(query.limit) === -1;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = isAll
    ? null
    : Math.max(1, Math.min(Number(query.limit) || 20, 500));

  const offset =
    query.offset !== undefined && query.offset !== null && query.offset !== ""
      ? Math.max(0, Number(query.offset))
      : undefined;

  let safeShiftType = null;
  if (query.shift_type) {
    const validShiftTypes = ["day", "evening", "night", "flexible"];
    const t = String(query.shift_type).toLowerCase().trim();
    if (validShiftTypes.includes(t)) {
      safeShiftType = t;
    }
  }

  let safeIsDefault = undefined;
  if (query.is_default !== undefined && query.is_default !== null && query.is_default !== "") {
    safeIsDefault =
      query.is_default === true || query.is_default === "true" || query.is_default === 1 || query.is_default === "1";
  }

  return {
    ...query,
    school_id: safeSchoolId,
    created_by: safeCreatedBy,
    updated_by: safeUpdatedBy,
    search: query.search ? String(query.search).trim() : null,
    q: query.q ? String(query.q).trim() : null,
    name: query.name ? String(query.name).trim() : null,
    shift_type: safeShiftType,
    status: safeStatus,
    is_default: safeIsDefault,
    page,
    limit: isAll ? "all" : limit,
    offset,
    all: isAll,
    sortBy: safeSortBy,
    sort_by: safeSortBy,
    sortOrder: safeSortOrder,
    sort_order: safeSortOrder,
    paginate:
      query.paginate !== undefined
        ? String(query.paginate).toLowerCase()
        : undefined,
    format: query.format ? String(query.format).toLowerCase().trim() : undefined,
  };
};
