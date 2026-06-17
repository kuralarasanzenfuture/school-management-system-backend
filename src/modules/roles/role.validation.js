export const validateCreateRole = (data) => {
  let { role_name, role_description } = data;

  if (!role_name) {
    throw { status: 400, message: "role_name is required" };
  }

  role_name = role_name.trim().toUpperCase();

  if (!/^[A-Z_]+$/.test(role_name)) {
    throw {
      status: 400,
      message: "Role name must contain only letters and underscore",
    };
  }

  if (role_name === "ADMIN") {
    throw {
      status: 403,
      message: "ADMIN is system protected",
    };
  }

  if (role_description && role_description.length > 500) {
    throw {
      status: 400,
      message: "role_description too long",
    };
  }

  return { role_name, role_description };
};

export const validateUpdateRole = (data) => {
  let { role_name, role_description, status } = data;

  if (!role_name) {
    throw { status: 400, message: "role_name is required" };
  }

  role_name = role_name.trim().toUpperCase();

  if (!/^[A-Z0-9_ ]+$/.test(role_name)) {
    throw {
      status: 400,
      message: "Invalid role format",
    };
  }

  if (status) {
    status = status.toLowerCase();

    if (!["active", "inactive"].includes(status)) {
      throw {
        status: 400,
        message: "status must be active or inactive",
      };
    }
  }

  if (role_description && role_description.length > 500) {
    throw {
      status: 400,
      message: "role_description too long",
    };
  }

  return { role_name, role_description, status };
};

export const validateRoleName = (role_name) => {
  if (!role_name) throw { status: 400, message: "role_name is required" };

  role_name = role_name.trim().toUpperCase();

  if (!/^[A-Z_]+$/.test(role_name)) {
    throw {
      status: 400,
      message: "Role must contain only uppercase letters and _",
    };
  }

  if (role_name === "ADMIN") {
    throw { status: 403, message: "ADMIN is protected" };
  }

  return role_name;
};

export const validateStatus = (status) => {
  if (!status) return null;

  status = status.toLowerCase().trim();

  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return status;
};
