import { parseBoolean } from "../../../utils/toBoolean.js";

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

/* =================================================================
   CREATE VALIDATION
================================================================= */
export const validateCreate = (data) => {
  let { school_id, name, code, days_per_year, applicable_gender, status } =
    data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name || !name.trim()) throw { status: 400, message: "name required" };
  if (!code || !code.trim()) throw { status: 400, message: "code required" };

  const schoolIdNum = Number(school_id);
  if (isNaN(schoolIdNum) || !Number.isInteger(schoolIdNum) || schoolIdNum <= 0) {
    throw { status: 400, message: "Valid school_id required" };
  }

  const cleanCreatedBy = validateBigIntId(data.created_by, "created_by");
  const cleanUpdatedBy = validateBigIntId(data.updated_by, "updated_by");

  const cleaned = {
    school_id: schoolIdNum,
    name: name.trim().toUpperCase(),
    code: code.trim().toUpperCase(),

    description: data.description ? String(data.description).trim() : null,

    days_per_year: Number(days_per_year) || 0,

    max_days_per_request:
      data.max_days_per_request !== undefined &&
      data.max_days_per_request !== null
        ? Number(data.max_days_per_request)
        : null,

    is_paid: data.is_paid !== undefined ? parseBoolean(data.is_paid) : true,

    carry_forward:
      data.carry_forward !== undefined
        ? parseBoolean(data.carry_forward)
        : false,

    max_carry_forward_days:
      data.max_carry_forward_days !== undefined
        ? Number(data.max_carry_forward_days)
        : 0,

    allow_half_day:
      data.allow_half_day !== undefined
        ? parseBoolean(data.allow_half_day)
        : true,

    requires_approval:
      data.requires_approval !== undefined
        ? parseBoolean(data.requires_approval)
        : true,

    requires_attachment:
      data.requires_attachment !== undefined
        ? parseBoolean(data.requires_attachment)
        : false,

    applicable_gender: applicable_gender
      ? String(applicable_gender).toLowerCase().trim()
      : "all",
    status: status ? String(status).toLowerCase().trim() : "active",
    created_by: cleanCreatedBy,
    updated_by: cleanUpdatedBy,
  };

  // 🔥 Business validation
  if (!cleaned.carry_forward && cleaned.max_carry_forward_days > 0) {
    throw {
      status: 400,
      message: "max_carry_forward_days must be 0 when carry_forward is false",
    };
  }

  if (
    cleaned.max_carry_forward_days !== undefined &&
    cleaned.days_per_year !== undefined &&
    cleaned.max_carry_forward_days > cleaned.days_per_year
  ) {
    throw {
      status: 400,
      message: "max_carry_forward_days cannot be greater than days_per_year",
    };
  }

  if (
    cleaned.max_days_per_request !== null &&
    cleaned.max_days_per_request > cleaned.days_per_year
  ) {
    throw {
      status: 400,
      message: "max_days_per_request cannot exceed days_per_year",
    };
  }

  if (cleaned.days_per_year > 365) {
    throw { status: 400, message: "days_per_year cannot exceed 365" };
  }

  if (!/^[A-Z0-9_]+$/.test(cleaned.code)) {
    throw {
      status: 400,
      message: "Invalid code format. Only uppercase alphanumeric and underscores allowed",
    };
  }

  if (!["all", "male", "female"].includes(cleaned.applicable_gender)) {
    throw { status: 400, message: "Invalid applicable_gender. Allowed: all, male, female" };
  }

  if (!["active", "inactive"].includes(cleaned.status)) {
    throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
  }

  return cleaned;
};

/* =================================================================
   UPDATE VALIDATION
================================================================= */
export const validateUpdate = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  const cleaned = {};

  if (data.school_id !== undefined && data.school_id !== null && data.school_id !== "") {
    const sId = Number(data.school_id);
    if (isNaN(sId) || !Number.isInteger(sId) || sId <= 0) {
      throw { status: 400, message: "Valid school_id required" };
    }
    cleaned.school_id = sId;
  }

  // 🔹 name
  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }
    cleaned.name = data.name.trim().toUpperCase();
  }

  // 🔹 code
  if (data.code !== undefined) {
    if (!data.code || !data.code.trim()) {
      throw { status: 400, message: "code cannot be empty" };
    }
    const cleanCode = data.code.trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
      throw {
        status: 400,
        message: "Invalid code format. Only uppercase alphanumeric and underscores allowed",
      };
    }
    cleaned.code = cleanCode;
  }

  // 🔹 description
  if (data.description !== undefined) {
    cleaned.description = data.description ? String(data.description).trim() : null;
  }

  // 🔹 days_per_year
  if (data.days_per_year !== undefined) {
    const val = Number(data.days_per_year);
    if (isNaN(val) || val < 0 || val > 365) {
      throw { status: 400, message: "Invalid days_per_year (must be between 0 and 365)" };
    }
    cleaned.days_per_year = val;
  }

  // 🔹 max_days_per_request
  if (data.max_days_per_request !== undefined) {
    const val =
      data.max_days_per_request !== null && data.max_days_per_request !== ""
        ? Number(data.max_days_per_request)
        : null;

    if (val !== null && (isNaN(val) || val < 0)) {
      throw { status: 400, message: "Invalid max_days_per_request" };
    }

    cleaned.max_days_per_request = val;
  }

  // 🔹 is_paid
  if (data.is_paid !== undefined) {
    cleaned.is_paid = parseBoolean(data.is_paid);
  }

  // 🔹 carry_forward
  if (data.carry_forward !== undefined) {
    cleaned.carry_forward = parseBoolean(data.carry_forward);
  }

  // 🔹 max_carry_forward_days
  if (data.max_carry_forward_days !== undefined) {
    const val = Number(data.max_carry_forward_days);
    if (isNaN(val) || val < 0) {
      throw {
        status: 400,
        message: "Invalid max_carry_forward_days",
      };
    }
    cleaned.max_carry_forward_days = val;
  }

  // 🔹 allow_half_day
  if (data.allow_half_day !== undefined) {
    cleaned.allow_half_day = parseBoolean(data.allow_half_day);
  }

  // 🔹 requires_approval
  if (data.requires_approval !== undefined) {
    cleaned.requires_approval = parseBoolean(data.requires_approval);
  }

  // 🔹 requires_attachment
  if (data.requires_attachment !== undefined) {
    cleaned.requires_attachment = parseBoolean(data.requires_attachment);
  }

  // 🔹 applicable_gender
  if (data.applicable_gender !== undefined) {
    const cleanGender = String(data.applicable_gender).toLowerCase().trim();
    if (!["all", "male", "female"].includes(cleanGender)) {
      throw { status: 400, message: "Invalid applicable_gender. Allowed: all, male, female" };
    }
    cleaned.applicable_gender = cleanGender;
  }

  // 🔹 status
  if (data.status !== undefined) {
    const cleanStatus = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(cleanStatus)) {
      throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
    }
    cleaned.status = cleanStatus;
  }

  // 🔹 created_by & updated_by
  if (data.created_by !== undefined) {
    cleaned.created_by = validateBigIntId(data.created_by, "created_by");
  }

  if (data.updated_by !== undefined) {
    cleaned.updated_by = validateBigIntId(data.updated_by, "updated_by");
  }

  // 🔥 Business validation (update case)
  if (cleaned.carry_forward === false && cleaned.max_carry_forward_days > 0) {
    throw {
      status: 400,
      message: "Cannot set carry forward days when carry_forward is false",
    };
  }

  if (
    cleaned.max_carry_forward_days !== undefined &&
    cleaned.days_per_year !== undefined &&
    cleaned.max_carry_forward_days > cleaned.days_per_year
  ) {
    throw {
      status: 400,
      message: "max_carry_forward_days cannot be greater than days_per_year",
    };
  }

  if (
    cleaned.max_days_per_request !== undefined &&
    cleaned.max_days_per_request !== null &&
    cleaned.days_per_year !== undefined &&
    cleaned.max_days_per_request > cleaned.days_per_year
  ) {
    throw {
      status: 400,
      message: "max_days_per_request cannot exceed days_per_year",
    };
  }

  return cleaned;
};

/* =================================================================
   STATUS VALIDATION
================================================================= */
export const validateLeaveTypeStatus = (status) => {
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

/* =================================================================
   FILTER & QUERY VALIDATION
================================================================= */
export const validateLeaveTypeFilters = (query = {}) => {
  const allowedSortCols = [
    "id",
    "name",
    "code",
    "days_per_year",
    "max_days_per_request",
    "is_paid",
    "carry_forward",
    "max_carry_forward_days",
    "allow_half_day",
    "requires_approval",
    "requires_attachment",
    "applicable_gender",
    "status",
    "school_id",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
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

  let safeGender = null;
  if (query.applicable_gender) {
    const g = String(query.applicable_gender).toLowerCase().trim();
    if (["all", "male", "female"].includes(g)) {
      safeGender = g;
    }
  }

  let safeIsPaid = undefined;
  if (query.is_paid !== undefined && query.is_paid !== null && query.is_paid !== "") {
    safeIsPaid = parseBoolean(query.is_paid);
  }

  let safeCarryForward = undefined;
  if (query.carry_forward !== undefined && query.carry_forward !== null && query.carry_forward !== "") {
    safeCarryForward = parseBoolean(query.carry_forward);
  }

  let safeRequiresApproval = undefined;
  if (query.requires_approval !== undefined && query.requires_approval !== null && query.requires_approval !== "") {
    safeRequiresApproval = parseBoolean(query.requires_approval);
  }

  let safeRequiresAttachment = undefined;
  if (query.requires_attachment !== undefined && query.requires_attachment !== null && query.requires_attachment !== "") {
    safeRequiresAttachment = parseBoolean(query.requires_attachment);
  }

  let safeAllowHalfDay = undefined;
  if (query.allow_half_day !== undefined && query.allow_half_day !== null && query.allow_half_day !== "") {
    safeAllowHalfDay = parseBoolean(query.allow_half_day);
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

  return {
    ...query,
    school_id: safeSchoolId,
    created_by: safeCreatedBy,
    updated_by: safeUpdatedBy,
    search: query.search ? String(query.search).trim() : null,
    q: query.q ? String(query.q).trim() : null,
    name: query.name ? String(query.name).trim() : null,
    code: query.code ? String(query.code).trim().toUpperCase() : null,
    status: safeStatus,
    applicable_gender: safeGender,
    is_paid: safeIsPaid,
    carry_forward: safeCarryForward,
    requires_approval: safeRequiresApproval,
    requires_attachment: safeRequiresAttachment,
    allow_half_day: safeAllowHalfDay,
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
