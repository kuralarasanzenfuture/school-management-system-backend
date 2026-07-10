export const validateCreateClassSubject = (data) => {
  let {
    school_id,
    class_id,
    subject_id,
    subject_group_id,
    employee_id,
    academic_year_id,
    is_optional,
  } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!class_id) throw { status: 400, message: "class_id required" };
  if (!subject_id) throw { status: 400, message: "subject_id required" };
  if (!academic_year_id)
    throw { status: 400, message: "academic_year_id required" };

  return {
    school_id: Number(school_id),
    class_id: Number(class_id),
    subject_id: Number(subject_id),
    subject_group_id: subject_group_id ? Number(subject_group_id) : null,
    employee_id: employee_id ? Number(employee_id) : null,
    academic_year_id: Number(academic_year_id),
    is_optional:
      is_optional === true ||
      is_optional === "true" ||
      is_optional === 1 ||
      is_optional === "1",
  };
};

export const validateUpdateClassSubject = (data) => {
  const cleaned = {};

  if (data.class_id !== undefined) cleaned.class_id = Number(data.class_id);

  if (data.subject_id !== undefined)
    cleaned.subject_id = Number(data.subject_id);

  if (data.subject_group_id !== undefined)
    cleaned.subject_group_id = data.subject_group_id
      ? Number(data.subject_group_id)
      : null;

  if (data.employee_id !== undefined)
    cleaned.employee_id = data.employee_id ? Number(data.employee_id) : null;

  if (data.academic_year_id !== undefined)
    cleaned.academic_year_id = Number(data.academic_year_id);

  if (data.is_optional !== undefined)
    cleaned.is_optional =
      data.is_optional === true ||
      data.is_optional === "true" ||
      data.is_optional === 1 ||
      data.is_optional === "1";

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};
