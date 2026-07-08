export const validateCreateClassSection = (data) => {
  let {
    school_id,
    class_id,
    section_id,
    academic_year_id,
    class_teacher_id,
    capacity,
    status,
  } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!class_id) throw { status: 400, message: "class_id required" };
  if (!section_id) throw { status: 400, message: "section_id required" };
  if (!academic_year_id)
    throw { status: 400, message: "academic_year_id required" };

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id: Number(school_id),
    class_id: Number(class_id),
    section_id: Number(section_id),
    academic_year_id: Number(academic_year_id),
    class_teacher_id: class_teacher_id ? Number(class_teacher_id) : null,
    capacity: capacity ? Number(capacity) : null,
    status: status || "active",
  };
};

export const validateUpdateClassSection = (data) => {
  const cleaned = {};

  if (data.school_id !== undefined)
    cleaned.school_id = data.school_id ? Number(data.school_id) : null;

  if (data.class_id !== undefined)
    cleaned.class_id = data.class_id ? Number(data.class_id) : null;

  if (data.section_id !== undefined)
    cleaned.section_id = data.section_id ? Number(data.section_id) : null;

  if (data.academic_year_id !== undefined)
    cleaned.academic_year_id = data.academic_year_id
      ? Number(data.academic_year_id)
      : null;

  if (data.class_teacher_id !== undefined)
    cleaned.class_teacher_id = data.class_teacher_id
      ? Number(data.class_teacher_id)
      : null;

  if (data.capacity !== undefined)
    cleaned.capacity = data.capacity ? Number(data.capacity) : null;

  if (data.status !== undefined) {
    const status = data.status.toLowerCase();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = status;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};
