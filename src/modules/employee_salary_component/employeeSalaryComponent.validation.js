/* =================================================================
   CREATE VALIDATION
================================================================= */
export const validateCreate = (data = {}) => {
  const { school_id, name, code, component_type, calculation_type, status } =
    data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name || !String(name).trim()) throw { status: 400, message: "name required" };
  if (!code || !String(code).trim()) throw { status: 400, message: "code required" };
  if (!component_type) {
    throw { status: 400, message: "component_type required" };
  }

  const schoolIdNum = Number(school_id);
  if (isNaN(schoolIdNum) || !Number.isInteger(schoolIdNum) || schoolIdNum <= 0) {
    throw { status: 400, message: "Valid school_id required" };
  }

  const cleanComponentType = String(component_type).toLowerCase().trim();
  if (!["earning", "deduction"].includes(cleanComponentType)) {
    throw { status: 400, message: "Invalid component_type. Allowed: earning, deduction" };
  }

  const cleanCalculationType = calculation_type
    ? String(calculation_type).toLowerCase().trim()
    : "fixed";
  if (!["fixed", "percentage"].includes(cleanCalculationType)) {
    throw { status: 400, message: "Invalid calculation_type. Allowed: fixed, percentage" };
  }

  const cleanStatus = status ? String(status).toLowerCase().trim() : "active";
  if (!["active", "inactive"].includes(cleanStatus)) {
    throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
  }

  const cleanCode = String(code).trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
    throw {
      status: 400,
      message: "Invalid code format. Only uppercase alphanumeric characters and underscores allowed",
    };
  }

  return {
    school_id: schoolIdNum,
    name: String(name).trim().toUpperCase(),
    code: cleanCode,
    component_type: cleanComponentType,
    calculation_type: cleanCalculationType,
    status: cleanStatus,
  };
};

/* =================================================================
   UPDATE VALIDATION
================================================================= */
export const validateUpdate = (data = {}) => {
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

  if (data.name !== undefined) {
    if (!String(data.name).trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }
    cleaned.name = String(data.name).trim().toUpperCase();
  }

  if (data.code !== undefined) {
    if (!String(data.code).trim()) {
      throw { status: 400, message: "code cannot be empty" };
    }
    const cleanCode = String(data.code).trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
      throw {
        status: 400,
        message: "Invalid code format. Only uppercase alphanumeric characters and underscores allowed",
      };
    }
    cleaned.code = cleanCode;
  }

  if (data.component_type !== undefined) {
    const cleanType = String(data.component_type).toLowerCase().trim();
    if (!["earning", "deduction"].includes(cleanType)) {
      throw { status: 400, message: "Invalid component_type. Allowed: earning, deduction" };
    }
    cleaned.component_type = cleanType;
  }

  if (data.calculation_type !== undefined) {
    const cleanCalc = String(data.calculation_type).toLowerCase().trim();
    if (!["fixed", "percentage"].includes(cleanCalc)) {
      throw { status: 400, message: "Invalid calculation_type. Allowed: fixed, percentage" };
    }
    cleaned.calculation_type = cleanCalc;
  }

  if (data.status !== undefined) {
    const cleanStatus = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(cleanStatus)) {
      throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
    }
    cleaned.status = cleanStatus;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

/* =================================================================
   STATUS VALIDATION
================================================================= */
export const validateSalaryComponentStatus = (status) => {
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
export const validateSalaryComponentFilters = (query = {}) => {
  const allowedSortCols = [
    "id",
    "name",
    "code",
    "component_type",
    "calculation_type",
    "status",
    "school_id",
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

  // Status parsing (single or comma-separated)
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

  // School ID parsing
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

  // Component type filter
  const validTypes = ["earning", "deduction"];
  let safeComponentType = null;
  if (query.component_type) {
    if (Array.isArray(query.component_type)) {
      const filtered = query.component_type
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => validTypes.includes(t));
      if (filtered.length === 1) safeComponentType = filtered[0];
      else if (filtered.length > 1) safeComponentType = filtered.join(",");
    } else {
      const t = String(query.component_type).toLowerCase().trim();
      if (t.includes(",")) {
        const parts = t
          .split(",")
          .map((p) => p.trim())
          .filter((p) => validTypes.includes(p));
        if (parts.length > 0) safeComponentType = parts.join(",");
      } else if (validTypes.includes(t)) {
        safeComponentType = t;
      }
    }
  }

  // Calculation type filter
  const validCalcTypes = ["fixed", "percentage"];
  let safeCalculationType = null;
  if (query.calculation_type) {
    if (Array.isArray(query.calculation_type)) {
      const filtered = query.calculation_type
        .map((c) => String(c).toLowerCase().trim())
        .filter((c) => validCalcTypes.includes(c));
      if (filtered.length === 1) safeCalculationType = filtered[0];
      else if (filtered.length > 1) safeCalculationType = filtered.join(",");
    } else {
      const c = String(query.calculation_type).toLowerCase().trim();
      if (c.includes(",")) {
        const parts = c
          .split(",")
          .map((p) => p.trim())
          .filter((p) => validCalcTypes.includes(p));
        if (parts.length > 0) safeCalculationType = parts.join(",");
      } else if (validCalcTypes.includes(c)) {
        safeCalculationType = c;
      }
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
    code: query.code ? String(query.code).trim().toUpperCase() : null,
    component_type: safeComponentType,
    calculation_type: safeCalculationType,
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
