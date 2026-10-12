/**
 * Subject Validations
 */

export const validateCreateSubject = (data = {}) => {
  let { school_id, name, code, subject_type, status } = data;

  if (!school_id) throw { status: 400, message: "school_id is required" };
  if (isNaN(Number(school_id))) throw { status: 400, message: "Invalid school_id" };

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "Subject name is required" };
  }

  const trimmedName = name.trim().toUpperCase();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw {
      status: 400,
      message: "Subject name must be between 2 and 100 characters",
    };
  }

  let cleanCode = null;
  if (code !== undefined && code !== null && String(code).trim()) {
    cleanCode = String(code).trim().toUpperCase();
    if (cleanCode.length > 20) {
      throw { status: 400, message: "Subject code cannot exceed 20 characters" };
    }
  }

  let cleanType = "theory";
  if (subject_type !== undefined && subject_type !== null) {
    cleanType = String(subject_type).toLowerCase().trim();
    if (!["theory", "practical", "both"].includes(cleanType)) {
      throw {
        status: 400,
        message: "Invalid subject_type. Must be 'theory', 'practical', or 'both'",
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
    code: cleanCode,
    subject_type: cleanType,
    status: cleanStatus,
  };
};

export const validateUpdateSubject = (data = {}) => {
  const cleaned = {};

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      throw { status: 400, message: "Subject name cannot be empty" };
    }
    const trimmedName = data.name.trim().toUpperCase();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw {
        status: 400,
        message: "Subject name must be between 2 and 100 characters",
      };
    }
    cleaned.name = trimmedName;
  }

  if (data.code !== undefined) {
    if (data.code) {
      const cleanCode = String(data.code).trim().toUpperCase();
      if (cleanCode.length > 20) {
        throw { status: 400, message: "Subject code cannot exceed 20 characters" };
      }
      cleaned.code = cleanCode;
    } else {
      cleaned.code = null;
    }
  }

  if (data.subject_type !== undefined) {
    const type = String(data.subject_type).toLowerCase().trim();
    if (!["theory", "practical", "both"].includes(type)) {
      throw {
        status: 400,
        message: "Invalid subject_type. Must be 'theory', 'practical', or 'both'",
      };
    }
    cleaned.subject_type = type;
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

export const validateSubjectFilters = (query = {}) => {
  const {
    school_id,
    status,
    subject_type,
    search,
    name,
    code,
    page = 1,
    limit = 20,
    sortBy = "id",
    sortOrder = "DESC",
    paginate = "true",
  } = query;

  const allowedSortCols = [
    "id",
    "name",
    "code",
    "subject_type",
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

  let safeType = null;
  if (subject_type) {
    const t = String(subject_type).toLowerCase().trim();
    if (["theory", "practical", "both"].includes(t)) {
      safeType = t;
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
    subject_type: safeType,
    search: search ? String(search).trim() : null,
    name: name ? String(name).trim() : null,
    code: code ? String(code).trim() : null,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    paginate: String(paginate).toLowerCase() !== "false",
  };
};
