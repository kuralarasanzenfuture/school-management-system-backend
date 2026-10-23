const VALID_ADMISSION_TYPES = ["new", "promoted", "transfer"];
const VALID_ADMISSION_STATUSES = [
  "pending",
  "active",
  "completed",
  "transferred",
  "dropped",
  "cancelled",
];

export const validateCreateAdmission = (data) => {
  if (!data || typeof data !== "object") {
    throw { status: 400, message: "Request body must be an object" };
  }

  let {
    student_id,
    academic_year_id,
    class_id,
    admission_number,
    admission_date,
    joining_date,
    subject_group_id,
    subject_group,
    transport_required,
    hostel_required,
    admission_type,
    status,
    // Optional section allocation parameters at time of admission
    class_section_id,
    section_id,
    section,
    roll_no,
    allocation_date,
    remarks,
  } = data;

  if (!student_id || isNaN(Number(student_id)) || Number(student_id) <= 0) {
    throw { status: 400, message: "student_id is required and must be a valid positive number" };
  }
  if (!academic_year_id || isNaN(Number(academic_year_id)) || Number(academic_year_id) <= 0) {
    throw { status: 400, message: "academic_year_id is required and must be a valid positive number" };
  }
  if (!class_id || isNaN(Number(class_id)) || Number(class_id) <= 0) {
    throw { status: 400, message: "class_id is required and must be a valid positive number" };
  }

  // Validate admission_type if provided
  const cleanAdmissionType = admission_type ? String(admission_type).trim().toLowerCase() : "new";
  if (!VALID_ADMISSION_TYPES.includes(cleanAdmissionType)) {
    throw {
      status: 400,
      message: `Invalid admission_type: '${admission_type}'. Allowed: ${VALID_ADMISSION_TYPES.join(", ")}`,
    };
  }

  // Validate status if provided
  const cleanStatus = status ? String(status).trim().toLowerCase() : "active";
  if (!VALID_ADMISSION_STATUSES.includes(cleanStatus)) {
    throw {
      status: 400,
      message: `Invalid status: '${status}'. Allowed: ${VALID_ADMISSION_STATUSES.join(", ")}`,
    };
  }

  // Parse subject_group_id
  let parsedSubjectGroupId = null;
  if (subject_group_id !== undefined && subject_group_id !== null && subject_group_id !== "") {
    parsedSubjectGroupId = Number(subject_group_id);
    if (isNaN(parsedSubjectGroupId) || parsedSubjectGroupId <= 0) {
      throw { status: 400, message: "subject_group_id must be a valid positive number" };
    }
  }

  const cleanSubjectGroup = subject_group ? String(subject_group).trim() : null;

  // Class section ID validation if provided
  let parsedClassSectionId = null;
  if (class_section_id !== undefined && class_section_id !== null && class_section_id !== "") {
    parsedClassSectionId = Number(class_section_id);
    if (isNaN(parsedClassSectionId) || parsedClassSectionId <= 0) {
      throw { status: 400, message: "class_section_id must be a valid positive number" };
    }
  }

  let parsedSectionId = null;
  if (section_id !== undefined && section_id !== null && section_id !== "") {
    parsedSectionId = Number(section_id);
    if (isNaN(parsedSectionId) || parsedSectionId <= 0) {
      throw { status: 400, message: "section_id must be a valid positive number" };
    }
  }

  return {
    student_id: Number(student_id),
    academic_year_id: Number(academic_year_id),
    class_id: Number(class_id),
    admission_number: admission_number ? String(admission_number).trim() : null,
    admission_date: admission_date ? String(admission_date).slice(0, 10) : null,
    joining_date: joining_date ? String(joining_date).slice(0, 10) : null,
    subject_group_id: parsedSubjectGroupId,
    subject_group: cleanSubjectGroup,
    transport_required: transport_required === true || transport_required === "true" || transport_required === 1 || transport_required === "1",
    hostel_required: hostel_required === true || hostel_required === "true" || hostel_required === 1 || hostel_required === "1",
    admission_type: cleanAdmissionType,
    status: cleanStatus,

    // Section allocation extras
    class_section_id: parsedClassSectionId,
    section_id: parsedSectionId,
    section: section ? String(section).trim() : null,
    roll_no: roll_no ? String(roll_no).trim() : null,
    allocation_date: allocation_date ? String(allocation_date).slice(0, 10) : null,
    remarks: remarks ? String(remarks).trim() : null,
  };
};

export const validateUpdateAdmission = (data) => {
  if (!data || typeof data !== "object") {
    throw { status: 400, message: "Request body must be an object" };
  }

  const cleaned = {};

  if (data.class_id !== undefined) {
    const cid = Number(data.class_id);
    if (isNaN(cid) || cid <= 0) {
      throw { status: 400, message: "class_id must be a valid positive number" };
    }
    cleaned.class_id = cid;
  }

  if (data.academic_year_id !== undefined) {
    const yid = Number(data.academic_year_id);
    if (isNaN(yid) || yid <= 0) {
      throw { status: 400, message: "academic_year_id must be a valid positive number" };
    }
    cleaned.academic_year_id = yid;
  }

  if (data.subject_group_id !== undefined) {
    if (data.subject_group_id === null || data.subject_group_id === "") {
      cleaned.subject_group_id = null;
    } else {
      const sgid = Number(data.subject_group_id);
      if (isNaN(sgid) || sgid <= 0) {
        throw { status: 400, message: "subject_group_id must be a valid positive number" };
      }
      cleaned.subject_group_id = sgid;
    }
  }

  if (data.subject_group !== undefined) {
    cleaned.subject_group = data.subject_group !== null ? String(data.subject_group).trim() : null;
  }

  if (data.admission_number !== undefined) {
    cleaned.admission_number = String(data.admission_number).trim();
    if (!cleaned.admission_number) {
      throw { status: 400, message: "admission_number cannot be empty" };
    }
  }

  if (data.admission_date !== undefined) {
    cleaned.admission_date = data.admission_date ? String(data.admission_date).slice(0, 10) : null;
  }

  if (data.joining_date !== undefined) {
    cleaned.joining_date = data.joining_date ? String(data.joining_date).slice(0, 10) : null;
  }

  if (data.transport_required !== undefined) {
    cleaned.transport_required =
      data.transport_required === true ||
      data.transport_required === "true" ||
      data.transport_required === 1 ||
      data.transport_required === "1";
  }

  if (data.hostel_required !== undefined) {
    cleaned.hostel_required =
      data.hostel_required === true ||
      data.hostel_required === "true" ||
      data.hostel_required === 1 ||
      data.hostel_required === "1";
  }

  if (data.admission_type !== undefined) {
    const type = String(data.admission_type).trim().toLowerCase();
    if (!VALID_ADMISSION_TYPES.includes(type)) {
      throw {
        status: 400,
        message: `Invalid admission_type: '${data.admission_type}'. Allowed: ${VALID_ADMISSION_TYPES.join(", ")}`,
      };
    }
    cleaned.admission_type = type;
  }

  if (data.status !== undefined) {
    const st = String(data.status).trim().toLowerCase();
    if (!VALID_ADMISSION_STATUSES.includes(st)) {
      throw {
        status: 400,
        message: `Invalid status: '${data.status}'. Allowed: ${VALID_ADMISSION_STATUSES.join(", ")}`,
      };
    }
    cleaned.status = st;
  }

  return cleaned;
};
