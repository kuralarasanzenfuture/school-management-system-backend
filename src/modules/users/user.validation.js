// export const validateCreateUser = (data) => {
//   let { username, email, phone, password, role_id } = data;

// //   if (!username || !password || !role_id) {
// //     throw { status: 400, message: "username, password, role_id required" };
// //   }

//   if (!username) {
//     throw { status: 400, message: "username is required" };
//   }
//   if (!phone) {
//     throw { status: 400, message: "phone is required" };
//   }

//   if (!password) {
//     throw { status: 400, message: "password is required" };
//   }

//   if (!role_id) {
//     throw { status: 400, message: "role_id is required" };
//   }

//   username = username.trim();

//   if (password.length < 6) {
//     throw { status: 400, message: "Password must be at least 6 characters" };
//   }

//   return { username, email, phone, password, role_id };
// };

export const validateCreateUser = (data) => {
  let { username, email, phone, password, roles } = data;

  if (!username) {
    throw { status: 400, message: "username is required" };
  }
  if (!phone) {
    throw { status: 400, message: "phone is required" };
  }

  if (!password) {
    throw { status: 400, message: "password is required" };
  }
  if (!Array.isArray(roles)) {
    throw {
      status: 400,
      message: "roles[] required",
    };
  }

  if (roles.length === 0) {
    throw {
      status: 400,
      message: "At least one role required",
    };
  }

  return data;
};

export const validateUpdateUser = (data) => {
  let { username, email, phone, password, roles, status } = data;

  if (username !== undefined && !username.trim()) {
    throw { status: 400, message: "username cannot be empty" };
  }

  if (phone !== undefined && !phone.trim()) {
    throw { status: 400, message: "phone cannot be empty" };
  }

  if (password !== undefined && password.length < 6) {
    throw {
      status: 400,
      message: "password must be at least 6 characters",
    };
  }

  if (roles !== undefined) {
    if (!Array.isArray(roles)) {
      throw {
        status: 400,
        message: "roles must be an array",
      };
    }

    if (roles.length === 0) {
      throw {
        status: 400,
        message: "At least one role required",
      };
    }
  }

  if (status !== undefined) {
    if (!["active", "inactive"].includes(status)) {
      throw {
        status: 400,
        message: "status must be active or inactive",
      };
    }
  }

  return data;
};

export const validateLoginUser = (data) => {
  let { login_id, password } = data;

  if (!login_id) {
    throw { status: 400, message: "login_id is required" };
  }

  if (!password) {
    throw { status: 400, message: "password is required" };
  }

  login_id = login_id.trim().toLowerCase();

  return { login_id, password };
};
