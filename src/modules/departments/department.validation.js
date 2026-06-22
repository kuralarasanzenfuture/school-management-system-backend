export const validateCreateDepartment = (data) => {
  let { school_id, name, description } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name) {
    throw { status: 400, message: "name is required" };
  }

  return {
    school_id: Number(school_id),
    name: name.trim(),
    description: description || null,
  };
};

export const validateUpdateDepartment = (data) => {
  let { name, description } = data;

  if (!name && !description) {
    throw { status: 400, message: "Nothing to update" };
  }

  return {
    name: name ? name.trim() : undefined,
    description: description || undefined,
  };
};