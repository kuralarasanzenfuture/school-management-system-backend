/**
 * Class Validations
 */

export const validateCreateClass = (data = {}) => {
  let { school_id, name, status } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (isNaN(Number(school_id))) {
    throw { status: 400, message: "Invalid school_id" };
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "class name is required" };
  }

  const trimmedName = name.trim().toUpperCase();

  if (trimmedName.length < 1 || trimmedName.length > 50) {
    throw {
      status: 400,
      message: "Class name must be between 1 and 50 characters",
    };
  }

  if (!/^[0-9A-Za-z\s-]+$/.test(trimmedName)) {
    throw {
      status: 400,
      message:
        "Class name can only contain letters, numbers, spaces, and hyphens (e.g. 1, 10, LKG, Pre-KG)",
    };
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
    status: cleanStatus,
  };
};

export const validateUpdateClass = (data = {}) => {
  const updates = {};

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }

    const trimmedName = data.name.trim().toUpperCase();

    if (trimmedName.length < 1 || trimmedName.length > 50) {
      throw {
        status: 400,
        message: "Class name must be between 1 and 50 characters",
      };
    }

    if (!/^[0-9A-Za-z\s-]+$/.test(trimmedName)) {
      throw {
        status: 400,
        message:
          "Invalid class name. Can only contain letters, numbers, spaces, and hyphens",
      };
    }

    updates.name = trimmedName;
  }

  if (data.status !== undefined) {
    const status = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Status must be 'active' or 'inactive'" };
    }
    updates.status = status;
  }

  if (data.school_id !== undefined) {
    if (isNaN(Number(data.school_id))) {
      throw { status: 400, message: "Invalid school_id" };
    }
    updates.school_id = Number(data.school_id);
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return updates;
};

export const validateClassFilters = (query = {}) => {
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
    "school_name",
    "created_at",
    "updated_at",
  ];
  const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : "id";
  const safeSortOrder =
    String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  let safeStatus = null;
  if (status) {
    if (Array.isArray(status)) {
      const validStatuses = status
        .map((s) => String(s).toLowerCase().trim())
        .filter((s) => ["active", "inactive", "none"].includes(s));
      if (validStatuses.length === 1) {
        safeStatus = validStatuses[0];
      } else if (validStatuses.length > 1) {
        safeStatus = validStatuses;
      }
    } else {
      const s = String(status).toLowerCase().trim();
      if (s.includes(",")) {
        const parts = s
          .split(",")
          .map((p) => p.trim())
          .filter((p) => ["active", "inactive", "none"].includes(p));
        if (parts.length === 1) {
          safeStatus = parts[0];
        } else if (parts.length > 1) {
          safeStatus = parts;
        }
      } else if (["active", "inactive", "none"].includes(s)) {
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