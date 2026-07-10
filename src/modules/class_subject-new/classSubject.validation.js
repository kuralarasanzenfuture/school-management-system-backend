// classSubject.validation.js
export const validateCreateClassSubject = (data) => {
  let {
    class_section_id,
    subject_id,
    subject_group_id,
    employee_id,
    is_optional,
    weekly_periods,
  } = data;

  if (!class_section_id)
    throw { status: 400, message: "class_section_id required" };
  if (!subject_id) throw { status: 400, message: "subject_id required" };

  return {
    class_section_id: Number(class_section_id),
    subject_id: Number(subject_id),
    subject_group_id: subject_group_id ? Number(subject_group_id) : null,
    employee_id: employee_id ? Number(employee_id) : null,
    is_optional: is_optional === true || is_optional === "true",
    weekly_periods: weekly_periods ? Number(weekly_periods) : 0,
  };
};

export const validateUpdateClassSubject = (data) => {
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
      data.is_optional === true || data.is_optional === "true";
  }

  if (data.weekly_periods !== undefined) {
    cleaned.weekly_periods = Number(data.weekly_periods) || 0;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};
