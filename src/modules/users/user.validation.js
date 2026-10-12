/**
 * User Validations
 */

export const validateCreateUser = (data = {}) => {
  let { username, email, phone, password, roles, school_id } = data;

  if (!username || !String(username).trim()) {
    throw { status: 400, message: "username is required" };
  }

  if (!phone || !String(phone).trim()) {
    throw { status: 400, message: "phone is required" };
  }

  if (!password) {
    throw { status: 400, message: "password is required" };
  }

  if (String(password).length < 6) {
    throw { status: 400, message: "Password must be at least 6 characters" };
  }

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    throw { status: 400, message: "At least one role required" };
  }

  // Normalize
  username = String(username).trim();
  email = email ? String(email).trim().toLowerCase() : null;
  phone = String(phone).trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw { status: 400, message: "Invalid email format" };
  }

  if (school_id !== undefined && school_id !== null) {
    if (isNaN(Number(school_id))) {
      throw { status: 400, message: "Invalid school_id" };
    }
  }

  return {
    username,
    email,
    phone,
    password,
    roles,
    school_id: school_id ? Number(school_id) : null,
  };
};

export const validateUpdateUser = (data = {}) => {
  let { username, email, phone, password, roles, status, school_id } = data;

  const cleaned = {};

  if (username !== undefined) {
    if (!String(username).trim()) {
      throw { status: 400, message: "username cannot be empty" };
    }
    cleaned.username = String(username).trim();
  }

  if (email !== undefined) {
    if (email) {
      const normalized = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw { status: 400, message: "Invalid email format" };
      }
      cleaned.email = normalized;
    } else {
      cleaned.email = null;
    }
  }

  if (phone !== undefined) {
    if (!String(phone).trim()) {
      throw { status: 400, message: "phone cannot be empty" };
    }
    cleaned.phone = String(phone).trim();
  }

  if (password !== undefined) {
    if (String(password).length < 6) {
      throw {
        status: 400,
        message: "password must be at least 6 characters",
      };
    }
    cleaned.password = password;
  }

  if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw { status: 400, message: "roles[] required" };
    }
    cleaned.roles = roles;
  }

  if (status !== undefined) {
    const s = String(status).toLowerCase().trim();
    if (!["active", "inactive"].includes(s)) {
      throw {
        status: 400,
        message: "status must be active or inactive",
      };
    }
    cleaned.status = s;
  }

  if (school_id !== undefined) {
    if (school_id !== null && isNaN(Number(school_id))) {
      throw { status: 400, message: "Invalid school_id" };
    }
    cleaned.school_id = school_id ? Number(school_id) : null;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

export const validateUserFilters = (query = {}) => {
  const {
    username,
    email,
    phone,
    status,
    role_id,
    role,
    school_id,
    search,
    page = 1,
    limit = 20,
    sortBy = "id",
    sortOrder = "DESC",
    paginate = "true",
  } = query;

  const allowedSortCols = [
    "id",
    "username",
    "email",
    "phone",
    "status",
    "school_id",
    "created_at",
    "last_login_at",
  ];
  const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : "id";
  const safeSortOrder =
    String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  let safeStatus = null;
  if (status) {
    const s = String(status).toLowerCase().trim();
    if (["active", "inactive"].includes(s)) {
      safeStatus = s;
    }
  }

  return {
    username: username ? String(username).trim() : null,
    email: email ? String(email).trim().toLowerCase() : null,
    phone: phone ? String(phone).trim() : null,
    status: safeStatus,
    role_id: role_id ? Number(role_id) : null,
    role: role ? String(role).trim().toUpperCase() : null,
    school_id: school_id ? Number(school_id) : null,
    search: search ? String(search).trim() : null,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    paginate: String(paginate).toLowerCase() !== "false",
  };
};

export const validateLoginUser = (data = {}) => {
  let { login_id, password } = data;

  if (!login_id) {
    throw { status: 400, message: "login_id is required" };
  }

  if (!password) {
    throw { status: 400, message: "password is required" };
  }

  login_id = String(login_id).trim().toLowerCase();

  return { login_id, password };
};

export const validateChangePassword = (body = {}) => {
  const errors = [];

  if (!body.currentPassword) {
    errors.push("Current password is required");
  }

  if (!body.newPassword) {
    errors.push("New password is required");
  }

  if (body.newPassword && String(body.newPassword).length < 6) {
    errors.push("New password must be at least 6 characters");
  }

  if (!body.confirmPassword) {
    errors.push("Confirm password is required");
  }

  if (
    body.newPassword &&
    body.confirmPassword &&
    body.newPassword !== body.confirmPassword
  ) {
    errors.push("Password confirmation does not match");
  }

  return errors;
};
