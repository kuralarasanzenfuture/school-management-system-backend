const VALID_ALLOCATION_STATUSES = [
  "active",
  "transferred",
  "completed",
  "cancelled",
];

export const validateCreateSectionAllocation = (data) => {
  if (!data || typeof data !== "object") {
    throw { status: 400, message: "Request body must be an object" };
  }

  let {
    admission_id,
    student_id,
    class_section_id,
    roll_no,
    allocation_date,
    effective_to,
    status,
    remarks,
  } = data;

  // Either admission_id or student_id must be provided
  let parsedAdmissionId = null;
  if (admission_id !== undefined && admission_id !== null && admission_id !== "") {
    parsedAdmissionId = Number(admission_id);
    if (isNaN(parsedAdmissionId) || parsedAdmissionId <= 0) {
      throw { status: 400, message: "admission_id must be a valid positive number" };
    }
  }

  let parsedStudentId = null;
  if (student_id !== undefined && student_id !== null && student_id !== "") {
    parsedStudentId = Number(student_id);
    if (isNaN(parsedStudentId) || parsedStudentId <= 0) {
      throw { status: 400, message: "student_id must be a valid positive number" };
    }
  }

  if (!parsedAdmissionId && !parsedStudentId) {
    throw {
      status: 400,
      message: "admission_id (or student_id) is required",
    };
  }

  // class_section_id is required
  if (!class_section_id || isNaN(Number(class_section_id)) || Number(class_section_id) <= 0) {
    throw { status: 400, message: "class_section_id is required and must be a valid positive number" };
  }

  const cleanStatus = status ? String(status).trim().toLowerCase() : "active";
  if (!VALID_ALLOCATION_STATUSES.includes(cleanStatus)) {
    throw {
      status: 400,
      message: `Invalid status: '${status}'. Allowed: ${VALID_ALLOCATION_STATUSES.join(", ")}`,
    };
  }

  const allocDate = allocation_date ? String(allocation_date).slice(0, 10) : null;
  const effTo = effective_to ? String(effective_to).slice(0, 10) : null;

  if (allocDate && effTo && effTo < allocDate) {
    throw {
      status: 400,
      message: `effective_to (${effTo}) must be greater than or equal to allocation_date (${allocDate})`,
    };
  }

  return {
    admission_id: parsedAdmissionId,
    student_id: parsedStudentId,
    class_section_id: Number(class_section_id),
    roll_no: roll_no !== undefined && roll_no !== null ? String(roll_no).trim() : null,
    allocation_date: allocDate,
    effective_to: effTo,
    status: cleanStatus,
    remarks: remarks !== undefined && remarks !== null ? String(remarks).trim() : null,
  };
};

export const validateUpdateSectionAllocation = (data) => {
  if (!data || typeof data !== "object") {
    throw { status: 400, message: "Request body must be an object" };
  }

  const cleaned = {};

  if (data.class_section_id !== undefined) {
    const csid = Number(data.class_section_id);
    if (isNaN(csid) || csid <= 0) {
      throw { status: 400, message: "class_section_id must be a valid positive number" };
    }
    cleaned.class_section_id = csid;
  }

  if (data.roll_no !== undefined) {
    cleaned.roll_no = data.roll_no !== null ? String(data.roll_no).trim() : null;
  }

  if (data.allocation_date !== undefined) {
    cleaned.allocation_date = data.allocation_date ? String(data.allocation_date).slice(0, 10) : null;
    if (!cleaned.allocation_date) {
      throw { status: 400, message: "allocation_date cannot be empty" };
    }
  }

  if (data.effective_to !== undefined) {
    cleaned.effective_to = data.effective_to ? String(data.effective_to).slice(0, 10) : null;
  }

  if (data.status !== undefined) {
    const st = String(data.status).trim().toLowerCase();
    if (!VALID_ALLOCATION_STATUSES.includes(st)) {
      throw {
        status: 400,
        message: `Invalid status: '${data.status}'. Allowed: ${VALID_ALLOCATION_STATUSES.join(", ")}`,
      };
    }
    cleaned.status = st;
  }

  if (data.remarks !== undefined) {
    cleaned.remarks = data.remarks !== null ? String(data.remarks).trim() : null;
  }

  return cleaned;
};


export const validateBulkSectionAllocations = (data) => {
  if (!data || typeof data !== "object") {
    throw { status: 400, message: "Request body must be an object" };
  }

  const {
    allocations,
    class_id,
    academic_year_id,
    school_id,
    default_class_section_id,
    allocation_date,
    status,
    remarks,
  } = data;

  if (!Array.isArray(allocations) || allocations.length === 0) {
    throw { status: 400, message: "allocations must be a non-empty array" };
  }

  const cleanStatus = status ? String(status).trim().toLowerCase() : "active";
  if (!VALID_ALLOCATION_STATUSES.includes(cleanStatus)) {
    throw {
      status: 400,
      message: `Invalid status: '${status}'. Allowed: ${VALID_ALLOCATION_STATUSES.join(", ")}`,
    };
  }

  const allocDate = allocation_date
    ? String(allocation_date).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const cleanedAllocations = allocations.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw { status: 400, message: `Item at index ${index} must be an object` };
    }

    const admission_id = Number(item.admission_id);
    if (!admission_id || isNaN(admission_id) || admission_id <= 0) {
      throw { status: 400, message: `Valid admission_id required at index ${index}` };
    }

    const csid = Number(item.class_section_id || default_class_section_id);
    if (!csid || isNaN(csid) || csid <= 0) {
      throw {
        status: 400,
        message: `Valid class_section_id required for admission ID ${admission_id}`,
      };
    }

    return {
      admission_id,
      student_id: item.student_id ? Number(item.student_id) : null,
      class_section_id: csid,
      roll_no:
        item.roll_no !== undefined && item.roll_no !== null
          ? String(item.roll_no).trim()
          : null,
      allocation_date: item.allocation_date
        ? String(item.allocation_date).slice(0, 10)
        : allocDate,
      effective_to: item.effective_to
        ? String(item.effective_to).slice(0, 10)
        : null,
      status: item.status
        ? String(item.status).trim().toLowerCase()
        : cleanStatus,
      remarks:
        item.remarks !== undefined && item.remarks !== null
          ? String(item.remarks).trim()
          : remarks || null,
    };
  });

  return {
    class_id: class_id ? Number(class_id) : null,
    academic_year_id: academic_year_id ? Number(academic_year_id) : null,
    school_id: school_id ? Number(school_id) : null,
    allocation_date: allocDate,
    status: cleanStatus,
    remarks: remarks || null,
    allocations: cleanedAllocations,
  };
};
