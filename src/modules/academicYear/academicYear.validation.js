/**
 * Academic Year Validations
 */

const VALID_STATUSES = ["active", "inactive", "archived"];

const isValidDate = (d) => {
  return d && !isNaN(new Date(d).getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(String(d).trim());
};

export const generateAcademicYearName = (startDate, endDate) => {
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  return `${startYear}-${endYear}`;
};

export const validateCreateAcademicYear = (data = {}) => {
  let { school_id, name, start_date, end_date, status, remarks } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (isNaN(Number(school_id))) {
    throw { status: 400, message: "Invalid school_id" };
  }

  if (!start_date || !end_date) {
    throw { status: 400, message: "start_date and end_date are required (YYYY-MM-DD)" };
  }

  const cleanStart = String(start_date).trim();
  const cleanEnd = String(end_date).trim();

  if (!isValidDate(cleanStart) || !isValidDate(cleanEnd)) {
    throw { status: 400, message: "Dates must be valid YYYY-MM-DD format" };
  }

  const startDateObj = new Date(cleanStart);
  const endDateObj = new Date(cleanEnd);

  if (startDateObj >= endDateObj) {
    throw { status: 400, message: "start_date must be before end_date" };
  }

  let cleanName = name ? String(name).trim() : generateAcademicYearName(cleanStart, cleanEnd);
  if (cleanName.length < 4 || cleanName.length > 20) {
    throw { status: 400, message: "Academic year name must be between 4 and 20 characters" };
  }

  let cleanStatus = "active";
  if (status !== undefined && status !== null) {
    cleanStatus = String(status).toLowerCase().trim();
    if (!VALID_STATUSES.includes(cleanStatus)) {
      throw {
        status: 400,
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      };
    }
  }

  let cleanRemarks = null;
  if (remarks !== undefined && remarks !== null) {
    cleanRemarks = String(remarks).trim();
    if (cleanRemarks.length > 255) {
      throw { status: 400, message: "Remarks cannot exceed 255 characters" };
    }
  }

  return {
    school_id: Number(school_id),
    name: cleanName,
    start_date: cleanStart,
    end_date: cleanEnd,
    status: cleanStatus,
    remarks: cleanRemarks,
  };
};

export const validateUpdateAcademicYear = (data = {}) => {
  const updates = {};

  if (data.start_date !== undefined) {
    const cleanStart = String(data.start_date).trim();
    if (!isValidDate(cleanStart)) {
      throw { status: 400, message: "start_date must be valid YYYY-MM-DD format" };
    }
    updates.start_date = cleanStart;
  }

  if (data.end_date !== undefined) {
    const cleanEnd = String(data.end_date).trim();
    if (!isValidDate(cleanEnd)) {
      throw { status: 400, message: "end_date must be valid YYYY-MM-DD format" };
    }
    updates.end_date = cleanEnd;
  }

  if (updates.start_date && updates.end_date) {
    if (new Date(updates.start_date) >= new Date(updates.end_date)) {
      throw { status: 400, message: "start_date must be before end_date" };
    }
  }

  if (data.name !== undefined) {
    const cleanName = String(data.name).trim();
    if (cleanName.length < 4 || cleanName.length > 20) {
      throw { status: 400, message: "Academic year name must be between 4 and 20 characters" };
    }
    updates.name = cleanName;
  }

  if (data.status !== undefined) {
    const status = String(data.status).toLowerCase().trim();
    if (!VALID_STATUSES.includes(status)) {
      throw {
        status: 400,
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      };
    }
    updates.status = status;
  }

  if (data.remarks !== undefined) {
    if (data.remarks) {
      const cleanRemarks = String(data.remarks).trim();
      if (cleanRemarks.length > 255) {
        throw { status: 400, message: "Remarks cannot exceed 255 characters" };
      }
      updates.remarks = cleanRemarks;
    } else {
      updates.remarks = null;
    }
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

export const validateAcademicYearFilters = (query = {}) => {
  const {
    school_id,
    status,
    search,
    name,
    page = 1,
    limit = 20,
    sortBy = "start_date",
    sortOrder = "DESC",
    paginate = "true",
  } = query;

  const allowedSortCols = [
    "id",
    "name",
    "start_date",
    "end_date",
    "status",
    "school_id",
    "school_name",
    "created_at",
    "updated_at",
  ];
  const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : "start_date";
  const safeSortOrder =
    String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  let safeStatus = null;
  if (status) {
    if (Array.isArray(status)) {
      const validStatuses = status
        .map((s) => String(s).toLowerCase().trim())
        .filter((s) => [...VALID_STATUSES, "none"].includes(s));
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
          .filter((p) => [...VALID_STATUSES, "none"].includes(p));
        if (parts.length === 1) {
          safeStatus = parts[0];
        } else if (parts.length > 1) {
          safeStatus = parts;
        }
      } else if ([...VALID_STATUSES, "none"].includes(s)) {
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