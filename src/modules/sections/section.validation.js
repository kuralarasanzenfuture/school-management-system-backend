export const validateCreateSection = (data) => {
  let { class_id, name, capacity, status } = data;

  if (!class_id) {
    throw { status: 400, message: "class_id is required" };
  }

  if (!name) {
    throw { status: 400, message: "section name is required" };
  }

  name = name.toString().trim().toUpperCase();

  if (!/^[A-Z0-9]+$/.test(name)) {
    throw {
      status: 400,
      message: "Section must be alphanumeric (A, B, C, A1)",
    };
  }

  if (capacity !== undefined && capacity !== null) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw {
        status: 400,
        message: "capacity must be a positive integer",
      };
    }
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    class_id: Number(class_id),
    name,
    capacity: capacity || null,
    status: status || "active",
  };
};

export const validateUpdateSection = (data) => {
  const updates = {};

  if (data.name !== undefined) {
    const name = data.name.toString().trim().toUpperCase();

    if (!name) {
      throw { status: 400, message: "name cannot be empty" };
    }

    if (!/^[A-Z0-9]+$/.test(name)) {
      throw { status: 400, message: "Invalid section name" };
    }

    updates.name = name;
  }

  if (data.capacity !== undefined) {
    if (data.capacity !== null) {
      if (!Number.isInteger(data.capacity) || data.capacity <= 0) {
        throw {
          status: 400,
          message: "capacity must be positive integer",
        };
      }
    }
    updates.capacity = data.capacity;
  }

  if (data.status !== undefined) {
    if (!["active", "inactive"].includes(data.status)) {
      throw { status: 400, message: "Invalid status" };
    }
    updates.status = data.status;
  }

  return updates;
};