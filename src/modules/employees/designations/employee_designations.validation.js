export const validateCreateDesignation = (data) => {
  let { school_id, name, description, status } = data;

  // REQUIRED
  if (!name) {
    throw { status: 400, message: "Name is required" };
  }

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  // CLEANING
  school_id = Number(school_id);
  if (isNaN(school_id) || school_id <= 0) {
    throw { status: 400, message: "Valid school_id is required" };
  }

  name = name.trim().toUpperCase(); // FORCE UPPERCASE
  description = description?.trim() || null;
  status = status?.toLowerCase() || "active";

  // ENUM CHECK
  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status. Allowed values: active, inactive" };
  }

  return {
    school_id,
    name,
    description,
    status,
  };
};

export const validateUpdateDesignation = (data) => {
  const cleaned = {};

  if (data.school_id !== undefined && data.school_id !== null && data.school_id !== "") {
    const school_id = Number(data.school_id);
    if (isNaN(school_id) || school_id <= 0) {
      throw { status: 400, message: "Valid school_id is required" };
    }
    cleaned.school_id = school_id;
  }

  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      throw { status: 400, message: "Name cannot be empty" };
    }
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.description !== undefined) {
    cleaned.description = data.description?.trim() || null;
  }

  if (data.status !== undefined) {
    const status = data.status.toLowerCase();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Invalid status. Allowed values: active, inactive" };
    }
    cleaned.status = status;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

export const validateDesignationStatus = (status) => {
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

export const validateDesignationFilters = (query = {}) => {
  const allowedSortCols = ["id", "name", "status", "school_id", "description"];
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
        .filter((n) => !isNaN(n) && n > 0);
    } else if (String(query.school_id).includes(",")) {
      safeSchoolId = String(query.school_id)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    } else if (!isNaN(Number(query.school_id)) && Number(query.school_id) > 0) {
      safeSchoolId = Number(query.school_id);
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

  return {
    ...query,
    school_id: safeSchoolId,
    search: query.search ? String(query.search).trim() : null,
    q: query.q ? String(query.q).trim() : null,
    name: query.name ? String(query.name).trim() : null,
    status: safeStatus,
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