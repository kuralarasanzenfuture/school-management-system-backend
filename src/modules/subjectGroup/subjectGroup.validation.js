export const validateCreateSubjectGroup = (data) => {
  let { school_id, name, description, status } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name?.trim()) throw { status: 400, message: "name required" };

  status = status || "active";

  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id: Number(school_id),
    name: name.trim().toUpperCase(),
    description: description?.trim() || null,
    status,
  };
};

export const validateUpdateSubjectGroup = (data) => {
  const cleaned = {};

  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw { status: 400, message: "name cannot be empty" };
    }
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.description !== undefined) {
    cleaned.description = data.description?.trim() || null;
  }

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
