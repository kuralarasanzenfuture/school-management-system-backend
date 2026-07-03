export const validateCreateDesignation = (data) => {
  let { school_id, name, description, status } = data;

  // REQUIRED
  if (!name) {
    throw { status: 400, message: "Name is required" };
  }

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  // CLEANING
  school_id = school_id ? Number(school_id) : null;

  name = name.trim().toUpperCase(); // 🔥 FORCE UPPERCASE
  description = description?.trim() || null;

  status = status?.toLowerCase() || "active";

  // ENUM CHECK
  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id,
    name,
    description,
    status,
  };
};

export const validateUpdateDesignation = (data) => {
  const cleaned = {};

  if (data.school_id !== undefined) {
    cleaned.school_id = data.school_id ? Number(data.school_id) : null;
  }

  if (data.name !== undefined) {
    cleaned.name = data.name.trim().toUpperCase(); // 🔥 IMPORTANT
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