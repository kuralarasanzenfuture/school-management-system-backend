// classSubject.validation.js
export const validateCreateClassSubject = (data = {}) => {
  let {
    class_section_id,
    subject_id,
    subject_group_id,
    employee_id,
    is_optional,
    weekly_periods,
    created_by,
  } = data;

  if (!class_section_id)
    throw { status: 400, message: "class_section_id is required" };
  if (!subject_id)
    throw { status: 400, message: "subject_id is required" };

  return {
    class_section_id: Number(class_section_id),
    subject_id: Number(subject_id),
    subject_group_id: subject_group_id ? Number(subject_group_id) : null,
    employee_id: employee_id ? Number(employee_id) : null,
    is_optional: is_optional === true || is_optional === "true" || is_optional === 1,
    weekly_periods: weekly_periods !== undefined && weekly_periods !== null ? Math.max(0, Number(weekly_periods) || 0) : 0,
    created_by: created_by ? Number(created_by) : null,
  };
};

export const validateUpdateClassSubject = (data = {}) => {
  const cleaned = {};

  if (data.subject_group_id !== undefined) {
    cleaned.subject_group_id = data.subject_group_id
      ? Number(data.subject_group_id)
      : null;
  }

  if (data.employee_id !== undefined) {
    cleaned.employee_id = data.employee_id ? Number(data.employee_id) : null;
  }

  if (data.is_optional !== undefined) {
    cleaned.is_optional =
      data.is_optional === true || data.is_optional === "true" || data.is_optional === 1;
  }

  if (data.weekly_periods !== undefined) {
    cleaned.weekly_periods = Math.max(0, Number(data.weekly_periods) || 0);
  }

  if (data.updated_by !== undefined) {
    cleaned.updated_by = data.updated_by ? Number(data.updated_by) : null;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

export const validateClassSubjectFilters = (query = {}) => {
  const {
    school_id,
    academic_year_id,
    class_id,
    section_id,
    class_section_id,
    subject_id,
    subject_group_id,
    employee_id,
    is_optional,
    subject_type,
    search,
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
    "school_name",
    "class_name",
    "section_name",
    "class_section_name",
    "subject_name",
    "subject_code",
    "subject_type",
    "subject_group_name",
    "teacher_name",
    "is_optional",
    "weekly_periods",
    "created_at",
    "updated_at",
  ];

  const reqSortBy = sort_by || sortBy || "id";
  const safeSortBy = allowedSortCols.includes(reqSortBy) ? reqSortBy : "id";
  const reqSortOrder = sort_order || sortOrder || "DESC";
  const safeSortOrder =
    String(reqSortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  let safeIsOptional = null;
  if (is_optional !== undefined && is_optional !== null && is_optional !== "" && is_optional !== "all") {
    safeIsOptional =
      is_optional === true || is_optional === "true" || is_optional === 1 || is_optional === "1";
  }

  let safeSubjectType = null;
  if (subject_type) {
    const st = String(subject_type).toLowerCase().trim();
    if (["theory", "practical", "both"].includes(st)) {
      safeSubjectType = st;
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
    academic_year_id:
      academic_year_id && !isNaN(Number(academic_year_id))
        ? Number(academic_year_id)
        : null,
    class_id:
      class_id && !isNaN(Number(class_id))
        ? Number(class_id)
        : null,
    section_id:
      section_id && !isNaN(Number(section_id))
        ? Number(section_id)
        : null,
    class_section_id:
      class_section_id && !isNaN(Number(class_section_id))
        ? Number(class_section_id)
        : null,
    subject_id:
      subject_id && !isNaN(Number(subject_id))
        ? Number(subject_id)
        : null,
    subject_group_id:
      subject_group_id === "none" || subject_group_id === "null"
        ? "none"
        : subject_group_id && !isNaN(Number(subject_group_id))
          ? Number(subject_group_id)
          : null,
    employee_id:
      employee_id === "unassigned" || employee_id === "none" || employee_id === "null"
        ? "unassigned"
        : employee_id && !isNaN(Number(employee_id))
          ? Number(employee_id)
          : null,
    is_optional: safeIsOptional,
    subject_type: safeSubjectType,
    search: search ? String(search).trim() : null,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    paginate: String(paginate).toLowerCase() !== "false",
  };
};
