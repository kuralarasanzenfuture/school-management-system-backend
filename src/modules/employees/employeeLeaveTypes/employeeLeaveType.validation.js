import { parseBoolean } from "../../../utils/toBoolean.js";

/* =========================
   CREATE VALIDATION
========================= */
export const validateCreate = (data) => {
  let { school_id, name, code, days_per_year, applicable_gender, status } =
    data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name || !name.trim()) throw { status: 400, message: "name required" };
  if (!code || !code.trim()) throw { status: 400, message: "code required" };

  const cleaned = {
    school_id: Number(school_id),
    name: name.trim().toUpperCase(),
    code: code.trim().toUpperCase(),

    description: data.description || null,

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

    applicable_gender: applicable_gender || "all",
    status: status || "active",
  };

  // 🔥 business validation
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

  if (!["all", "male", "female"].includes(cleaned.applicable_gender)) {
    throw { status: 400, message: "Invalid applicable_gender" };
  }

  if (!["active", "inactive"].includes(cleaned.status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return cleaned;
};

/* =========================
   UPDATE VALIDATION
========================= */
export const validateUpdate = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  const cleaned = {};

  // 🔹 name
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }
    cleaned.name = data.name.trim().toUpperCase();
  }

  // 🔹 code
  if (data.code !== undefined) {
    if (!data.code.trim()) {
      throw { status: 400, message: "code cannot be empty" };
    }
    cleaned.code = data.code.trim().toUpperCase();
  }

  // 🔹 description
  if (data.description !== undefined) {
    cleaned.description = data.description || null;
  }

  // 🔹 days_per_year
  if (data.days_per_year !== undefined) {
    const val = Number(data.days_per_year);
    if (isNaN(val) || val < 0) {
      throw { status: 400, message: "Invalid days_per_year" };
    }
    cleaned.days_per_year = val;
  }

  // 🔹 max_days_per_request
  if (data.max_days_per_request !== undefined) {
    const val =
      data.max_days_per_request !== null
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
    if (!["all", "male", "female"].includes(data.applicable_gender)) {
      throw { status: 400, message: "Invalid applicable_gender" };
    }
    cleaned.applicable_gender = data.applicable_gender;
  }

  // 🔹 status
  if (data.status !== undefined) {
    if (!["active", "inactive"].includes(data.status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = data.status;
  }

  // 🔥 business validation (update case)
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

  return cleaned;
};
