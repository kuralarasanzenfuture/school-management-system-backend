/* =================================================================
   CREATE VALIDATION
================================================================= */
export const validateCreate = (data = {}) => {
  const {
    salary_structure_id,
    component_id,
    calculation_type,
    amount,
    percentage,
    based_on,
  } = data;

  if (!salary_structure_id) {
    throw { status: 400, message: "salary_structure_id required" };
  }

  const structIdNum = Number(salary_structure_id);
  if (isNaN(structIdNum) || !Number.isInteger(structIdNum) || structIdNum <= 0) {
    throw { status: 400, message: "Valid salary_structure_id required" };
  }

  if (!component_id) {
    throw { status: 400, message: "component_id required" };
  }

  const compIdNum = Number(component_id);
  if (isNaN(compIdNum) || !Number.isInteger(compIdNum) || compIdNum <= 0) {
    throw { status: 400, message: "Valid component_id required" };
  }

  const cleanCalcType = calculation_type
    ? String(calculation_type).toLowerCase().trim()
    : "";
  if (!["fixed", "percentage"].includes(cleanCalcType)) {
    throw {
      status: 400,
      message: "Invalid calculation_type. Allowed: fixed, percentage",
    };
  }

  // Core logic validation
  let cleanAmount = null;
  let cleanPercentage = null;

  if (cleanCalcType === "fixed") {
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw { status: 400, message: "amount required and must be greater than 0 for fixed type" };
    }
    cleanAmount = Number(amount);
  } else if (cleanCalcType === "percentage") {
    if (percentage === undefined || percentage === null || isNaN(Number(percentage)) || Number(percentage) <= 0) {
      throw { status: 400, message: "percentage required and must be greater than 0" };
    }
    if (Number(percentage) > 100) {
      throw { status: 400, message: "percentage cannot exceed 100" };
    }
    cleanPercentage = Number(percentage);
  }

  const cleanBasedOn = based_on
    ? String(based_on).toLowerCase().trim()
    : "basic";
  if (!["basic", "gross"].includes(cleanBasedOn)) {
    throw { status: 400, message: "Invalid based_on. Allowed: basic, gross" };
  }

  return {
    salary_structure_id: structIdNum,
    component_id: compIdNum,
    calculation_type: cleanCalcType,
    amount: cleanAmount,
    percentage: cleanPercentage,
    based_on: cleanBasedOn,
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

  if (data.component_id !== undefined && data.component_id !== null && data.component_id !== "") {
    const cId = Number(data.component_id);
    if (isNaN(cId) || !Number.isInteger(cId) || cId <= 0) {
      throw { status: 400, message: "Valid component_id required" };
    }
    cleaned.component_id = cId;
  }

  if (data.calculation_type !== undefined) {
    const cleanType = String(data.calculation_type).toLowerCase().trim();
    if (!["fixed", "percentage"].includes(cleanType)) {
      throw {
        status: 400,
        message: "Invalid calculation_type. Allowed: fixed, percentage",
      };
    }
    cleaned.calculation_type = cleanType;
  }

  if (data.amount !== undefined) {
    if (data.amount === null || data.amount === "") {
      cleaned.amount = null;
    } else {
      const amt = Number(data.amount);
      if (isNaN(amt) || amt < 0) {
        throw { status: 400, message: "amount must be a valid non-negative number" };
      }
      cleaned.amount = amt;
    }
  }

  if (data.percentage !== undefined) {
    if (data.percentage === null || data.percentage === "") {
      cleaned.percentage = null;
    } else {
      const pct = Number(data.percentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw { status: 400, message: "percentage must be between 0 and 100" };
      }
      cleaned.percentage = pct;
    }
  }

  if (data.based_on !== undefined) {
    const cleanBasedOn = String(data.based_on).toLowerCase().trim();
    if (!["basic", "gross"].includes(cleanBasedOn)) {
      throw { status: 400, message: "Invalid based_on. Allowed: basic, gross" };
    }
    cleaned.based_on = cleanBasedOn;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

/* =================================================================
   FILTER & QUERY VALIDATION
================================================================= */
export const validateSalaryStructureDetailFilters = (query = {}) => {
  const allowedSortCols = [
    "id",
    "salary_structure_id",
    "component_id",
    "calculation_type",
    "amount",
    "percentage",
    "based_on",
    "created_at",
    "component_name",
    "structure_name",
    "school_name",
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

  // Parse ID helper
  const parseIdFilter = (val) => {
    if (val === undefined || val === null || val === "") return null;
    if (Array.isArray(val)) {
      return val
        .map(Number)
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    }
    if (String(val).includes(",")) {
      return String(val)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    }
    const num = Number(val);
    if (!isNaN(num) && Number.isInteger(num) && num > 0) {
      return num;
    }
    return null;
  };

  const safeSalaryStructureId = parseIdFilter(query.salary_structure_id);
  const safeComponentId = parseIdFilter(query.component_id);
  const safeSchoolId = parseIdFilter(query.school_id);
  const safeEmployeeId = parseIdFilter(query.employee_id);

  // Calculation Type filter
  const validCalcTypes = ["fixed", "percentage"];
  let safeCalcType = null;
  if (query.calculation_type) {
    if (Array.isArray(query.calculation_type)) {
      const filtered = query.calculation_type
        .map((c) => String(c).toLowerCase().trim())
        .filter((c) => validCalcTypes.includes(c));
      if (filtered.length === 1) safeCalcType = filtered[0];
      else if (filtered.length > 1) safeCalcType = filtered.join(",");
    } else {
      const c = String(query.calculation_type).toLowerCase().trim();
      if (c.includes(",")) {
        const parts = c
          .split(",")
          .map((p) => p.trim())
          .filter((p) => validCalcTypes.includes(p));
        if (parts.length > 0) safeCalcType = parts.join(",");
      } else if (validCalcTypes.includes(c)) {
        safeCalcType = c;
      }
    }
  }

  // Based on filter
  const validBasedOn = ["basic", "gross"];
  let safeBasedOn = null;
  if (query.based_on) {
    if (Array.isArray(query.based_on)) {
      const filtered = query.based_on
        .map((b) => String(b).toLowerCase().trim())
        .filter((b) => validBasedOn.includes(b));
      if (filtered.length === 1) safeBasedOn = filtered[0];
      else if (filtered.length > 1) safeBasedOn = filtered.join(",");
    } else {
      const b = String(query.based_on).toLowerCase().trim();
      if (b.includes(",")) {
        const parts = b
          .split(",")
          .map((p) => p.trim())
          .filter((p) => validBasedOn.includes(p));
        if (parts.length > 0) safeBasedOn = parts.join(",");
      } else if (validBasedOn.includes(b)) {
        safeBasedOn = b;
      }
    }
  }

  // Component type filter (from joined employee_salary_components)
  const validComponentTypes = ["earning", "deduction"];
  let safeComponentType = null;
  if (query.component_type) {
    if (Array.isArray(query.component_type)) {
      const filtered = query.component_type
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => validComponentTypes.includes(t));
      if (filtered.length === 1) safeComponentType = filtered[0];
      else if (filtered.length > 1) safeComponentType = filtered.join(",");
    } else {
      const t = String(query.component_type).toLowerCase().trim();
      if (t.includes(",")) {
        const parts = t
          .split(",")
          .map((p) => p.trim())
          .filter((p) => validComponentTypes.includes(p));
        if (parts.length > 0) safeComponentType = parts.join(",");
      } else if (validComponentTypes.includes(t)) {
        safeComponentType = t;
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
    salary_structure_id: safeSalaryStructureId,
    component_id: safeComponentId,
    school_id: safeSchoolId,
    employee_id: safeEmployeeId,
    calculation_type: safeCalcType,
    based_on: safeBasedOn,
    component_type: safeComponentType,
    search: query.search ? String(query.search).trim() : null,
    q: query.q ? String(query.q).trim() : null,
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
