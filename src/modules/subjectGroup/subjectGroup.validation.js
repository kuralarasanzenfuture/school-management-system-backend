/**
 * Subject Group Validations
 */

export const validateCreateSubjectGroup = (data = {}) => {
  let { school_id, name, description, status } = data;

  if (!school_id) throw { status: 400, message: "school_id is required" };
  if (isNaN(Number(school_id))) throw { status: 400, message: "Invalid school_id" };

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "Subject group name is required" };
  }

  const trimmedName = name.trim().toUpperCase();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw {
      status: 400,
      message: "Subject group name must be between 2 and 100 characters",
    };
  }

  let cleanDescription = null;
  if (description !== undefined && description !== null && String(description).trim()) {
    cleanDescription = String(description).trim();
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

export const validateUpdateSubjectGroup = (data = {}) => {
  const cleaned = {};

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      throw { status: 400, message: "Subject group name cannot be empty" };
    }
    const trimmedName = data.name.trim().toUpperCase();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw {
        status: 400,
        message: "Subject group name must be between 2 and 100 characters",
      };
    }
    cleaned.name = trimmedName;
  }

  if (data.description !== undefined) {
    if (data.description !== null && String(data.description).trim()) {
      cleaned.description = String(data.description).trim();
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

export const validateSubjectGroupStatus = (status) => {
  if (!status) {
    throw { status: 400, message: "Status is required" };
  }
  const cleanStatus = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(cleanStatus)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }
  return cleanStatus;
};

export const validateSubjectGroupFilters = (query = {}) => {
  const {
    school_id,
    status,
    search,
    name,
    page = 1,
    limit = 20,
    sortBy,
    sort_by,
    sortOrder,
    sort_order,
    paginate = "true",
  } = query;

  const allowedSortCols = [
    "id",
    "name",
    "status",
    "school_id",
    "school_name",
    "created_at",
    "updated_at",
  ];
  const reqSortBy = sort_by || sortBy || "id";
  const safeSortBy = allowedSortCols.includes(reqSortBy) ? reqSortBy : "id";
  const reqSortOrder = sort_order || sortOrder || "DESC";
  const safeSortOrder =
    String(reqSortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  let safeStatus = null;
  if (status) {
    if (status === "none") {
      safeStatus = "none";
    } else if (Array.isArray(status)) {
      const validStatuses = status
        .map((s) => String(s).toLowerCase().trim())
        .filter((s) => ["active", "inactive"].includes(s));
      if (validStatuses.length === 1) {
        safeStatus = validStatuses[0];
      } else if (validStatuses.length > 1) {
        safeStatus = validStatuses;
      } else {
        safeStatus = "none";
      }
    } else {
      const s = String(status).toLowerCase().trim();
      if (s === "none") {
        safeStatus = "none";
      } else if (s.includes(",")) {
        const parts = s
          .split(",")
          .map((p) => p.trim())
          .filter((p) => ["active", "inactive"].includes(p));
        if (parts.length === 1) {
          safeStatus = parts[0];
        } else if (parts.length > 1) {
          safeStatus = parts;
        } else {
          safeStatus = "none";
        }
      } else if (["active", "inactive"].includes(s)) {
        safeStatus = s;
      }
    }
  }

  return {
    school_id:
      school_id !== undefined &&
      school_id !== null &&
      school_id !== "" &&
      !isNaN(Number(school_id)) &&
      Number(school_id) > 0
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