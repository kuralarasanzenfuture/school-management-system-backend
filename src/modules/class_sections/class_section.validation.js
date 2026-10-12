export const validateCreateClassSection = (data = {}) => {
  let {
    school_id,
    class_id,
    section_id,
    academic_year_id,
    class_teacher_id,
    capacity,
    status,
  } = data;

  if (!school_id) throw { status: 400, message: "school_id is required" };
  if (!class_id) throw { status: 400, message: "class_id is required" };
  if (!section_id) throw { status: 400, message: "section_id is required" };
  if (!academic_year_id)
    throw { status: 400, message: "academic_year_id is required" };

  if (isNaN(Number(school_id))) throw { status: 400, message: "Invalid school_id" };
  if (isNaN(Number(class_id))) throw { status: 400, message: "Invalid class_id" };
  if (isNaN(Number(section_id))) throw { status: 400, message: "Invalid section_id" };
  if (isNaN(Number(academic_year_id)))
    throw { status: 400, message: "Invalid academic_year_id" };

  let cleanCapacity = null;
  if (capacity !== undefined && capacity !== null && capacity !== "") {
    const num = Number(capacity);
    if (!Number.isInteger(num) || num <= 0) {
      throw { status: 400, message: "capacity must be a positive integer" };
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
    school_id: Number(school_id),
    class_id: Number(class_id),
    section_id: Number(section_id),
    academic_year_id: Number(academic_year_id),
    class_teacher_id: class_teacher_id ? Number(class_teacher_id) : null,
    capacity: cleanCapacity,
    status: cleanStatus,
  };
};

export const validateUpdateClassSection = (data = {}) => {
  const cleaned = {};

  if (data.school_id !== undefined) {
    if (isNaN(Number(data.school_id))) throw { status: 400, message: "Invalid school_id" };
    cleaned.school_id = Number(data.school_id);
  }

  if (data.class_id !== undefined) {
    if (isNaN(Number(data.class_id))) throw { status: 400, message: "Invalid class_id" };
    cleaned.class_id = Number(data.class_id);
  }

  if (data.section_id !== undefined) {
    if (isNaN(Number(data.section_id))) throw { status: 400, message: "Invalid section_id" };
    cleaned.section_id = Number(data.section_id);
  }

  if (data.academic_year_id !== undefined) {
    if (isNaN(Number(data.academic_year_id)))
      throw { status: 400, message: "Invalid academic_year_id" };
    cleaned.academic_year_id = Number(data.academic_year_id);
  }

  if (data.class_teacher_id !== undefined) {
    cleaned.class_teacher_id = data.class_teacher_id
      ? Number(data.class_teacher_id)
      : null;
  }

  if (data.capacity !== undefined) {
    if (data.capacity !== null && data.capacity !== "") {
      const num = Number(data.capacity);
      if (!Number.isInteger(num) || num <= 0) {
        throw { status: 400, message: "capacity must be a positive integer" };
      }
      cleaned.capacity = num;
    } else {
      cleaned.capacity = null;
    }
  }

  if (data.status !== undefined) {
    const status = String(data.status).toLowerCase().trim();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Status must be 'active' or 'inactive'" };
    }
    cleaned.status = status;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

export const validateClassSectionFilters = (query = {}) => {
  const {
    school_id,
    class_id,
    section_id,
    academic_year_id,
    class_teacher_id,
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = "id",
    sortOrder = "DESC",
    paginate = "true",
  } = query;

  const allowedSortCols = [
    "id",
    "school_name",
    "class_name",
    "section_name",
    "academic_year",
    "class_teacher_name",
    "capacity",
    "status",
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
        .filter((s) => ["active", "inactive"].includes(s));
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
          .filter((p) => ["active", "inactive"].includes(p));
        if (parts.length === 1) {
          safeStatus = parts[0];
        } else if (parts.length > 1) {
          safeStatus = parts;
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
    class_id:
      class_id !== undefined &&
      class_id !== null &&
      class_id !== "" &&
      !isNaN(Number(class_id)) &&
      Number(class_id) > 0
        ? Number(class_id)
        : null,
    section_id:
      section_id !== undefined &&
      section_id !== null &&
      section_id !== "" &&
      !isNaN(Number(section_id)) &&
      Number(section_id) > 0
        ? Number(section_id)
        : null,
    academic_year_id:
      academic_year_id !== undefined &&
      academic_year_id !== null &&
      academic_year_id !== "" &&
      !isNaN(Number(academic_year_id)) &&
      Number(academic_year_id) > 0
        ? Number(academic_year_id)
        : null,
    class_teacher_id:
      class_teacher_id !== undefined &&
      class_teacher_id !== null &&
      class_teacher_id !== "" &&
      !isNaN(Number(class_teacher_id)) &&
      Number(class_teacher_id) > 0
        ? Number(class_teacher_id)
        : null,
    status: safeStatus,
    search: search ? String(search).trim() : null,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    paginate: String(paginate).toLowerCase() !== "false",
  };
};
