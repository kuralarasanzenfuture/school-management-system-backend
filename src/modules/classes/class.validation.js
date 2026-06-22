export const validateCreateClass = (data) => {
  let { school_id, name, status } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name) {
    throw { status: 400, message: "class name is required" };
  }

  name = name.toString().trim().toUpperCase();

  if (!/^[0-9A-Za-z]+$/.test(name)) {
    throw {
      status: 400,
      message: "Class name must be alphanumeric (e.g. 1, 10, LKG)",
    };
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id: Number(school_id),
    name,
    status: status || "active",
  };
};

export const validateUpdateClass = (data) => {
  const updates = {};

  if (data.name !== undefined) {
    const name = data.name.toString().trim().toUpperCase();

    if (!name) {
      throw { status: 400, message: "name cannot be empty" };
    }

    if (!/^[0-9A-Za-z]+$/.test(name)) {
      throw {
        status: 400,
        message: "Invalid class name",
      };
    }

    updates.name = name;
  }

  if (data.status !== undefined) {
    if (!["active", "inactive"].includes(data.status)) {
      throw { status: 400, message: "Invalid status" };
    }
    updates.status = data.status;
  }

  return updates;
};