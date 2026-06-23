export const validateCreateAdmission = (data) => {
  let {
    student_id,
    academic_year_id,
    class_id,
    section,
    joining_date,
    subject_group,
    transport_required,
    hostel_required,
    admission_type,
  } = data;

  if (!student_id) throw { status: 400, message: "student_id required" };
  if (!academic_year_id) throw { status: 400, message: "academic_year_id required" };
  if (!class_id) throw { status: 400, message: "class_id required" };

  return {
    student_id: Number(student_id),
    academic_year_id: Number(academic_year_id),
    class_id: Number(class_id),

    section: section?.trim() || null,
    joining_date: joining_date || null,
    subject_group: subject_group?.trim() || null,

    transport_required: transport_required === true || transport_required === "true",
    hostel_required: hostel_required === true || hostel_required === "true",

    admission_type: admission_type || "new",
  };
};

export const validateUpdateAdmission = (data) => {
  const cleaned = {};

  if (data.section !== undefined) {
    cleaned.section = data.section?.trim() || null;
  }

  if (data.subject_group !== undefined) {
    cleaned.subject_group = data.subject_group?.trim() || null;
  }

  if (data.transport_required !== undefined) {
    cleaned.transport_required =
      data.transport_required === true || data.transport_required === "true";
  }

  if (data.hostel_required !== undefined) {
    cleaned.hostel_required =
      data.hostel_required === true || data.hostel_required === "true";
  }

  if (data.status) {
    cleaned.status = data.status;
  }

  return cleaned;
};
