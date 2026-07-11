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

// export const validateCreateUser = (data) => {
//   let { username, email, phone, password, roles } = data;

//   if (!username) {
//     throw { status: 400, message: "username is required" };
//   }
//   if (!phone) {
//     throw { status: 400, message: "phone is required" };
//   }

//   if (!password) {
//     throw { status: 400, message: "password is required" };
//   }
//   if (!Array.isArray(roles)) {
//     throw {
//       status: 400,
//       message: "roles[] required",
//     };
//   }

//   if (roles.length === 0) {
//     throw {
//       status: 400,
//       message: "At least one role required",
//     };
//   }

//   return data;
// };

export const validateCreateUser = (data) => {
  let { username, email, phone, password, roles, school_id } = data;

  if (!username || !username.trim()) {
    throw { status: 400, message: "username is required" };
  }

  if (!phone) {
    throw { status: 400, message: "phone is required" };
  }

  if (!password) {
    throw { status: 400, message: "password is required" };
  }

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    throw { status: 400, message: "At least one role required" };
  }

  // 🔥 IMPORTANT: normalize
  username = username.trim();
  email = email ? email.toLowerCase() : null;
  phone = phone.trim();

  // 🔥 school_id optional but must be number if provided
  if (school_id !== undefined && school_id !== null) {
    if (isNaN(Number(school_id))) {
      throw { status: 400, message: "Invalid school_id" };
    }
  }

  return {
    username,
    email,
    phone,
    password,
    roles,
    school_id: school_id ? Number(school_id) : null,
  };
};

export const validateUpdateUser = (data) => {
  let { username, email, phone, password, roles, status, school_id } = data;

  const cleaned = {};

  if (username !== undefined) {
    if (!username.trim()) {
      throw { status: 400, message: "username cannot be empty" };
    }
    cleaned.username = username.trim();
  }

  if (email !== undefined) {
    cleaned.email = email ? email.toLowerCase() : null;
  }

  if (phone !== undefined) {
    if (!phone.trim()) {
      throw { status: 400, message: "phone cannot be empty" };
    }
    cleaned.phone = phone.trim();
  }

  if (password !== undefined) {
    if (password.length < 6) {
      throw {
        status: 400,
        message: "password must be at least 6 characters",
      };
    }
    cleaned.password = password;
  }

  if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw { status: 400, message: "roles[] required" };
    }
    cleaned.roles = roles;
  }

  if (status !== undefined) {
    if (!["active", "inactive"].includes(status)) {
      throw {
        status: 400,
        message: "status must be active or inactive",
      };
    }
    cleaned.status = status;
  }

  // 🔥 school_id handling
  if (school_id !== undefined) {
    if (school_id !== null && isNaN(Number(school_id))) {
      throw { status: 400, message: "Invalid school_id" };
    }
    cleaned.school_id = school_id ? Number(school_id) : null;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

// export const validateUpdateUser = (data) => {
//   let { username, email, phone, password, roles, status } = data;

//   if (username !== undefined && !username.trim()) {
//     throw { status: 400, message: "username cannot be empty" };
//   }

//   if (phone !== undefined && !phone.trim()) {
//     throw { status: 400, message: "phone cannot be empty" };
//   }

//   if (password !== undefined && password.length < 6) {
//     throw {
//       status: 400,
//       message: "password must be at least 6 characters",
//     };
//   }

//   if (roles !== undefined) {
//     if (!Array.isArray(roles)) {
//       throw {
//         status: 400,
//         message: "roles must be an array",
//       };
//     }

//     if (roles.length === 0) {
//       throw {
//         status: 400,
//         message: "At least one role required",
//       };
//     }
//   }

//   if (status !== undefined) {
//     if (!["active", "inactive"].includes(status)) {
//       throw {
//         status: 400,
//         message: "status must be active or inactive",
//       };
//     }
//   }

//   return data;
// };

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
