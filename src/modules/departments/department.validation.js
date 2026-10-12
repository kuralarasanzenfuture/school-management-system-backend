/**
 * Department Validations
 */

export const validateCreateDepartment = (data = {}) => {
  let { school_id, name, description, status } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (isNaN(Number(school_id))) {
    throw { status: 400, message: "Invalid school_id" };
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "name is required" };
  }

  const trimmedName = name.trim().toUpperCase();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw {
      status: 400,
      message: "Department name must be between 2 and 100 characters",
    };
  }

  let cleanDescription = null;
  if (description !== undefined && description !== null) {
    cleanDescription = String(description).trim();
    if (cleanDescription.length > 255) {
      throw {
        status: 400,
        message: "Description cannot exceed 255 characters",
      };
    }
  }

  let cleanStatus = "active";
  if (status !== undefined && status !== null) {
    cleanStatus = String(status).toLowerCase().trim();
    if (!["active", "inactive"].includes(cleanStatus)) {
      throw { status: 400, message: "Status must be 'active' or 'inactive'" };
    }
  }

  return {
    school_id: Number(school_id),
    name: trimmedName,
    description: cleanDescription,
    status: cleanStatus,
  };
};

export const validateUpdateDepartment = (data = {}) => {
  const cleaned = {};

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }
    const trimmedName = data.name.trim().toUpperCase();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw {
        status: 400,
        message: "Department name must be between 2 and 100 characters",
      };
    }
    cleaned.name = trimmedName;
  }

  if (data.description !== undefined) {
    if (data.description) {
      const trimmedDesc = String(data.description).trim();
      if (trimmedDesc.length > 255) {
        throw {
          status: 400,
          message: "Description cannot exceed 255 characters",
        };
      }
      cleaned.description = trimmedDesc;
    } else {
      cleaned.description = null;
    }
  }

  if (data.status !== undefined) {
    const status = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Status must be 'active' or 'inactive'" };
    }
    cleaned.status = status;
  }

  if (data.school_id !== undefined) {
    if (isNaN(Number(data.school_id))) {
      throw { status: 400, message: "Invalid school_id" };
    }
    cleaned.school_id = Number(data.school_id);
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

export const validateDepartmentFilters = (query = {}) => {
  const {
    school_id,
    status,
    search,
    name,
    page = 1,
    limit = 20,
    sortBy = "id",
    sortOrder = "DESC",
    paginate = "true",
  } = query;

  const allowedSortCols = [
    "id",
    "name",
    "status",
    "school_id",
    "created_at",
    "updated_at",
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
    school_id:
      school_id !== undefined && school_id !== null && !isNaN(Number(school_id))
        ? Number(school_id)
        : null,
    status: safeStatus,
    search: search ? String(search).trim() : null,
    name: name ? String(name).trim() : null,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    paginate: String(paginate).toLowerCase() !== "false",
  };
};
