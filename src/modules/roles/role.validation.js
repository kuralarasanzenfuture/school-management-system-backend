import {
  generateRoleCode,
  validateRoleCode,
} from "./utils/generateRoleCode.js";

export { generateRoleCode, validateRoleCode };

export const validateRoleName = (name) => {
  if (!name || typeof name !== "string") {
    throw { status: 400, message: "name is required" };
  }

  const trimmed = name.trim().toUpperCase();

  if (trimmed.length < 2 || trimmed.length > 100) {
    throw { status: 400, message: "Role name must be between 2 and 100 characters" };
  }

  if (!/^[A-Z0-9_ ]+$/.test(trimmed)) {
    throw {
      status: 400,
      message: "Role name can only contain letters, numbers, spaces, and underscores",
    };
  }

  return trimmed;
};

export const validateStatus = (status) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  if (!["active", "inactive"].includes(normalized)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }

  return normalized;
};

export const validateCreateRole = (data = {}) => {
  const name = validateRoleName(data.name || data.role_name);
  const role_code = generateRoleCode(name);

  let description = data.description || data.role_description || null;
  if (description) {
    description = String(description).trim();
    if (description.length > 500) {
      throw { status: 400, message: "Description cannot exceed 500 characters" };
    }
  }

  const status = validateStatus(data.status) || "active";
  const is_system = data.is_system ? 1 : 0;

  return {
    name,
    role_code,
    description,
    status,
    is_system,
  };
};

export const validateUpdateRole = (data = {}) => {
  const payload = {};

  if (data.name !== undefined || data.role_name !== undefined) {
    payload.name = validateRoleName(data.name || data.role_name);
    payload.role_code = generateRoleCode(payload.name);
  }

  if (data.description !== undefined || data.role_description !== undefined) {
    const desc = data.description !== undefined ? data.description : data.role_description;
    if (desc) {
      const trimmed = String(desc).trim();
      if (trimmed.length > 500) {
        throw { status: 400, message: "Description cannot exceed 500 characters" };
      }
      payload.description = trimmed;
    } else {
      payload.description = null;
    }
  }

  if (data.status !== undefined) {
    payload.status = validateStatus(data.status);
  }

  return payload;
};

export const validateRoleFilters = (query = {}) => {
  const {
    name,
    role_code,
    status,
    is_system,
    search,
    page = 1,
    limit = 20,
    sortBy = "id",
    sortOrder = "ASC",
    paginate = "true",
  } = query;

  const allowedSortCols = ["id", "name", "role_code", "status", "is_system", "created_at"];
  const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : "id";
  const safeSortOrder = String(sortOrder).toUpperCase() === "DESC" ? "DESC" : "ASC";

  return {
    name: name ? String(name).trim() : null,
    role_code: role_code ? String(role_code).trim() : null,
    status: status ? validateStatus(status) : null,
    is_system: is_system !== undefined && is_system !== null ? (is_system === "1" || is_system === true ? 1 : 0) : null,
    search: search ? String(search).trim() : null,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    paginate: String(paginate).toLowerCase() !== "false",
  };
};
