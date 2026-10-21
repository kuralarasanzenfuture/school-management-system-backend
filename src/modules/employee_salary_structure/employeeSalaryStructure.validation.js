/* =================================================================
   CREATE VALIDATION
================================================================= */
export const validateCreate = (data = {}) => {
  const { employee_id, effective_from, effective_to, status, remarks } = data;

  if (!employee_id) {
    throw { status: 400, message: "employee_id required" };
  }

  const empIdNum = Number(employee_id);
  if (isNaN(empIdNum) || !Number.isInteger(empIdNum) || empIdNum <= 0) {
    throw { status: 400, message: "Valid employee_id required" };
  }

  if (!effective_from || !String(effective_from).trim()) {
    throw { status: 400, message: "effective_from required" };
  }

  const cleanEffectiveFrom = String(effective_from).trim();
  if (isNaN(Date.parse(cleanEffectiveFrom))) {
    throw { status: 400, message: "Invalid effective_from date format" };
  }

  let cleanEffectiveTo = null;
  if (effective_to !== undefined && effective_to !== null && String(effective_to).trim() !== "") {
    cleanEffectiveTo = String(effective_to).trim();
    if (isNaN(Date.parse(cleanEffectiveTo))) {
      throw { status: 400, message: "Invalid effective_to date format" };
    }
    if (new Date(cleanEffectiveTo) < new Date(cleanEffectiveFrom)) {
      throw {
        status: 400,
        message: "effective_to must be greater than or equal to effective_from",
      };
    }
  }

  const cleanStatus = status ? String(status).toLowerCase().trim() : "active";
  if (!["active", "inactive"].includes(cleanStatus)) {
    throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
  }

  return {
    employee_id: empIdNum,
    effective_from: cleanEffectiveFrom,
    effective_to: cleanEffectiveTo,
    remarks: remarks !== undefined && remarks !== null ? String(remarks).trim() : null,
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

  if (data.effective_from !== undefined) {
    if (!data.effective_from || !String(data.effective_from).trim()) {
      throw { status: 400, message: "effective_from cannot be empty" };
    }
    const cleanFrom = String(data.effective_from).trim();
    if (isNaN(Date.parse(cleanFrom))) {
      throw { status: 400, message: "Invalid effective_from date format" };
    }
    cleaned.effective_from = cleanFrom;
  }

  if (data.effective_to !== undefined) {
    if (data.effective_to === null || String(data.effective_to).trim() === "") {
      cleaned.effective_to = null;
    } else {
      const cleanTo = String(data.effective_to).trim();
      if (isNaN(Date.parse(cleanTo))) {
        throw { status: 400, message: "Invalid effective_to date format" };
      }
      cleaned.effective_to = cleanTo;
    }
  }

  if (cleaned.effective_from && cleaned.effective_to) {
    if (new Date(cleaned.effective_to) < new Date(cleaned.effective_from)) {
      throw {
        status: 400,
        message: "effective_to must be greater than or equal to effective_from",
      };
    }
  }

  if (data.status !== undefined) {
    const cleanStatus = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(cleanStatus)) {
      throw { status: 400, message: "Invalid status. Allowed: active, inactive" };
    }
    cleaned.status = cleanStatus;
  }

  if (data.remarks !== undefined) {
    cleaned.remarks =
      data.remarks !== null && String(data.remarks).trim() !== ""
        ? String(data.remarks).trim()
        : null;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

/* =================================================================
   STATUS VALIDATION
================================================================= */
export const validateSalaryStructureStatus = (status) => {
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
export const validateSalaryStructureFilters = (query = {}) => {
  const allowedSortCols = [
    "id",
    "structure_name",
    "effective_from",
    "effective_to",
    "status",
    "school_id",
    "employee_id",
    "created_by",
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
    } else if (
      !isNaN(Number(query.school_id)) &&
      Number.isInteger(Number(query.school_id)) &&
      Number(query.school_id) > 0
    ) {
      safeSchoolId = Number(query.school_id);
    }
  }

  // Employee ID parsing
  let safeEmployeeId = null;
  if (
    query.employee_id !== undefined &&
    query.employee_id !== null &&
    query.employee_id !== ""
  ) {
    if (Array.isArray(query.employee_id)) {
      safeEmployeeId = query.employee_id
        .map(Number)
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (String(query.employee_id).includes(",")) {
      safeEmployeeId = String(query.employee_id)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && Number.isInteger(n) && n > 0);
    } else if (
      !isNaN(Number(query.employee_id)) &&
      Number.isInteger(Number(query.employee_id)) &&
      Number(query.employee_id) > 0
    ) {
      safeEmployeeId = Number(query.employee_id);
    }
  }

  // Created By parsing
  let safeCreatedBy = null;
  if (
    query.created_by !== undefined &&
    query.created_by !== null &&
    query.created_by !== ""
  ) {
    const cNum = Number(query.created_by);
    if (!isNaN(cNum) && Number.isInteger(cNum) && cNum > 0) {
      safeCreatedBy = cNum;
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
    employee_id: safeEmployeeId,
    created_by: safeCreatedBy,
    search: query.search ? String(query.search).trim() : null,
    q: query.q ? String(query.q).trim() : null,
    structure_name: query.structure_name ? String(query.structure_name).trim() : null,
    effective_from: query.effective_from ? String(query.effective_from).trim() : null,
    effective_from_gte: query.effective_from_gte ? String(query.effective_from_gte).trim() : null,
    effective_from_lte: query.effective_from_lte ? String(query.effective_from_lte).trim() : null,
    effective_to: query.effective_to ? String(query.effective_to).trim() : null,
    effective_to_gte: query.effective_to_gte ? String(query.effective_to_gte).trim() : null,
    effective_to_lte: query.effective_to_lte ? String(query.effective_to_lte).trim() : null,
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
