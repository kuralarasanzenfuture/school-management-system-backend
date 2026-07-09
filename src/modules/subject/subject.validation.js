export const validateCreateSubject = (data) => {
  let { school_id, name, code, subject_type, status } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name?.trim()) throw { status: 400, message: "name required" };

  subject_type = subject_type || "theory";
  status = status || "active";

  if (!["theory", "practical", "both"].includes(subject_type)) {
    throw { status: 400, message: "Invalid subject_type" };
  }

  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id: Number(school_id),
    name: name.trim().toUpperCase(),
    code: code?.trim().toUpperCase() || null,
    subject_type,
    status,
  };
};

export const validateUpdateSubject = (data) => {
  const cleaned = {};

  if (data.name !== undefined) {
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.code !== undefined) {
    cleaned.code = data.code?.trim().toUpperCase() || null;
  }

  if (data.subject_type !== undefined) {
    const type = data.subject_type.toLowerCase();
    if (!["theory", "practical", "both"].includes(type)) {
      throw { status: 400, message: "Invalid subject_type" };
    }
    cleaned.subject_type = type;
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
