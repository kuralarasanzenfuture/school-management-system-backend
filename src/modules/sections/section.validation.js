/**
 * Section Validations
 */

export const validateCreateSection = (data = {}) => {
  let { class_id, name, capacity, status } = data;

  if (!class_id) {
    throw { status: 400, message: "class_id is required" };
  }

  if (isNaN(Number(class_id))) {
    throw { status: 400, message: "Invalid class_id" };
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "section name is required" };
  }

  name = name.trim().toUpperCase();

  if (name.length < 1 || name.length > 20) {
    throw {
      status: 400,
      message: "Section name must be between 1 and 20 characters",
    };
  }

  if (!/^[A-Z0-9\s-]+$/.test(name)) {
    throw {
      status: 400,
      message: "Section name can only contain letters, numbers, spaces, and hyphens (e.g. A, B, C, A1)",
    };
  }

  let cleanCapacity = null;
  if (capacity !== undefined && capacity !== null && capacity !== "") {
    const num = Number(capacity);
    if (!Number.isInteger(num) || num <= 0) {
      throw {
        status: 400,
        message: "capacity must be a positive integer",
      };
    }
    cleanCapacity = num;
  }

  let cleanStatus = "active";
  if (status !== undefined && status !== null) {
    cleanStatus = String(status).toLowerCase().trim();
    if (!["active", "inactive"].includes(cleanStatus)) {
      throw { status: 400, message: "Status must be 'active' or 'inactive'" };
    }
  }

  return {
    class_id: Number(class_id),
    name,
    capacity: cleanCapacity,
    status: cleanStatus,
  };
};

export const validateUpdateSection = (data = {}) => {
  const updates = {};

  if (data.class_id !== undefined) {
    if (isNaN(Number(data.class_id))) {
      throw { status: 400, message: "Invalid class_id" };
    }
    updates.class_id = Number(data.class_id);
  }

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }

    const name = data.name.trim().toUpperCase();

    if (name.length < 1 || name.length > 20) {
      throw {
        status: 400,
        message: "Section name must be between 1 and 20 characters",
      };
    }

    if (!/^[A-Z0-9\s-]+$/.test(name)) {
      throw {
        status: 400,
        message: "Invalid section name. Can only contain letters, numbers, spaces, and hyphens",
      };
    }

    updates.name = name;
  }

  if (data.capacity !== undefined) {
    if (data.capacity !== null && data.capacity !== "") {
      const num = Number(data.capacity);
      if (!Number.isInteger(num) || num <= 0) {
        throw {
          status: 400,
          message: "capacity must be a positive integer",
        };
      }
      updates.capacity = num;
    } else {
      updates.capacity = null;
    }
  }

  if (data.status !== undefined) {
    const status = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Status must be 'active' or 'inactive'" };
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return updates;
};

export const validateSectionFilters = (query = {}) => {
  const {
    class_id,
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
    "section_name",
    "capacity",
    "status",
    "class_id",
    "class_name",
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
    class_id:
      class_id !== undefined &&
      class_id !== null &&
      class_id !== "" &&
      !isNaN(Number(class_id)) &&
      Number(class_id) > 0
        ? Number(class_id)
        : null,
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
