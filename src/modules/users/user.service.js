import bcrypt from "bcrypt";
import { getDB } from "../../config/db.js";
import { UserModel } from "./user.model.js";
import { RoleModel } from "../roles/role.model.js";
import { validateCreateUser, validateUpdateUser } from "./user.validation.js";

// export const createUser = async (data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     const { username, email, phone, password, role_id } =
//       validateCreateUser(data);

//     // 🔴 Check duplicates
//     // const exists = await UserModel.findDuplicate({
//     //   email,
//     //   phone,
//     //   username,
//     // });

//     // if (exists) {
//     //   throw { status: 409, message: "User already exists" };
//     // }

//     const duplicate = await UserModel.findDuplicate({
//       email,
//       phone,
//       username,
//     });

//     if (duplicate) {
//       throw {
//         status: 409,
//         message: duplicate,
//       };
//     }

//     // 🔐 Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     await connection.beginTransaction();

//     // 1️⃣ Create user
//     const userId = await UserModel.create(connection, {
//       username,
//       email,
//       phone,
//       password: hashedPassword,
//       school_id: data.school_id || null,
//     });

//     // 2️⃣ Assign role
//     await UserModel.assignRole(connection, userId, role_id);

//     await connection.commit();

//     return { message: "User created successfully", user_id: userId };
//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

export const createUser = async (data) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const { username, email, phone, password, roles } =
      validateCreateUser(data);

    // 🔴 Duplicate check
    const duplicate = await UserModel.findDuplicate({
      email,
      phone,
      username,
    });

    if (duplicate) {
      throw { status: 409, message: duplicate };
    }

    const adminRoleId = await RoleModel.getAdminRoleId();

    if (roles.includes(adminRoleId)) {
      const exists = await RoleModel.isAdminAlreadyAssigned();

      if (exists) {
        throw {
          status: 400,
          message: "Only one ADMIN user allowed",
        };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    // 1️⃣ Create user
    const userId = await UserModel.create(connection, {
      username,
      email,
      phone,
      password: hashedPassword,
      school_id: data.school_id || null,
    });

    // 2️⃣ Assign MULTIPLE roles
    for (const role_id of roles) {
      await UserModel.assignRole(connection, userId, role_id);
    }

    await connection.commit();

    return {
      message: "User created successfully",
      user_id: userId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getAllUsers = async () => {
  const db = getDB();

  const [rows] = await db.query(`
    SELECT id, username, email, phone, status
    FROM users
    ORDER BY id DESC
  `);

  return rows;
};

export const checkUsername = async (username) => {
  const db = getDB();

  const [[user]] = await db.query(`SELECT id FROM users WHERE username = ?`, [
    username,
  ]);

  return {
    available: !user,
  };
};

export const checkEmail = async (email) => {
  const db = getDB();

  const [[user]] = await db.query(`SELECT id FROM users WHERE email = ?`, [
    email,
  ]);

  return {
    available: !user,
  };
};

export const checkPhone = async (phone) => {
  const db = getDB();

  const [[user]] = await db.query(`SELECT id FROM users WHERE phone = ?`, [
    phone,
  ]);

  return {
    available: !user,
  };
};

// export const updateUser = async (id, data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     let { username, email, phone, password, roles, status } = data;

//     await connection.beginTransaction();

//     // 1️⃣ Check user exists
//     const [[user]] = await connection.query(
//       `SELECT id FROM users WHERE id = ?`,
//       [id],
//     );

//     if (!user) {
//       throw { status: 404, message: "User not found" };
//     }

//     // 2️⃣ Check duplicates (excluding current user)
//     const [duplicate] = await connection.query(
//       `
//       SELECT id FROM users
//       WHERE (email = ? OR phone = ? OR username = ?)
//       AND id != ?
//       `,
//       [email, phone, username, id],
//     );

//     if (duplicate.length) {
//       throw { status: 409, message: "Duplicate user data" };
//     }

//     // 3️⃣ Update
//     await connection.query(
//       `
//       UPDATE users
//       SET username=?, email=?, phone=?
//       WHERE id=?
//       `,
//       [username, email, phone, id],
//     );

//     await connection.commit();

//     return { message: "User updated successfully" };
//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

// export const updateUser = async (id, data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     // 1️⃣ Validate input
//     const { username, email, phone, password, roles, status } =
//       validateUpdateUser(data);

//     await connection.beginTransaction();

//     // 2️⃣ Check user exists
//     const [[user]] = await connection.query(
//       `SELECT id FROM users WHERE id = ?`,
//       [id]
//     );

//     if (!user) {
//       throw { status: 404, message: "User not found" };
//     }

//     // 3️⃣ Get ADMIN role id
//     const [[adminRole]] = await connection.query(
//       `SELECT id FROM roles WHERE name = 'ADMIN'`
//     );

//     const adminRoleId = adminRole?.id;

//     // 4️⃣ Check if current user is ADMIN
//     const [[isCurrentAdmin]] = await connection.query(
//       `
//       SELECT 1
//       FROM user_roles
//       WHERE user_id = ? AND role_id = ?
//       `,
//       [id, adminRoleId]
//     );

//     // =========================
//     // 🔴 ROLE VALIDATION
//     // =========================

//     if (roles) {
//       // ❌ Prevent removing ADMIN
//       if (isCurrentAdmin && !roles.includes(adminRoleId)) {
//         throw {
//           status: 400,
//           message: "Cannot remove ADMIN role",
//         };
//       }

//       // ❌ Prevent multiple ADMIN
//       if (roles.includes(adminRoleId)) {
//         const [[count]] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM user_roles
//           WHERE role_id = ?
//           `,
//           [adminRoleId]
//         );

//         if (count.count > 0 && !isCurrentAdmin) {
//           throw {
//             status: 400,
//             message: "Only one ADMIN allowed",
//           };
//         }
//       }
//     }

//     // =========================
//     // 🔴 DUPLICATE CHECK
//     // =========================

//     if (username || email || phone) {
//       const [duplicate] = await connection.query(
//         `
//         SELECT id FROM users
//         WHERE (email = ? OR phone = ? OR username = ?)
//         AND id != ?
//         `,
//         [email || null, phone || null, username || null, id]
//       );

//       if (duplicate.length) {
//         throw { status: 409, message: "Duplicate user data" };
//       }
//     }

//     // =========================
//     // 🔴 UPDATE USER FIELDS
//     // =========================

//     const fields = [];
//     const values = [];

//     if (username) {
//       fields.push("username=?");
//       values.push(username);
//     }

//     if (email) {
//       fields.push("email=?");
//       values.push(email);
//     }

//     if (phone) {
//       fields.push("phone=?");
//       values.push(phone);
//     }

//     if (status) {
//       fields.push("status=?");
//       values.push(status);
//     }

//     if (fields.length) {
//       await connection.query(
//         `UPDATE users SET ${fields.join(", ")} WHERE id=?`,
//         [...values, id]
//       );
//     }

//     // =========================
//     // 🔴 PASSWORD UPDATE
//     // =========================

//     if (password) {
//       const hashed = await bcrypt.hash(password, 10);

//       await connection.query(
//         `UPDATE users SET password=? WHERE id=?`,
//         [hashed, id]
//       );
//     }

//     // =========================
//     // 🔴 ROLE DIFF UPDATE (IMPORTANT)
//     // =========================

//     if (roles) {
//       const [existingRoles] = await connection.query(
//         `SELECT role_id FROM user_roles WHERE user_id = ?`,
//         [id]
//       );

//       const existing = existingRoles.map(r => r.role_id);

//       const toAdd = roles.filter(r => !existing.includes(r));
//       const toRemove = existing.filter(r => !roles.includes(r));

//       // remove roles
//       if (toRemove.length) {
//         await connection.query(
//           `
//           DELETE FROM user_roles
//           WHERE user_id = ? AND role_id IN (?)
//           `,
//           [id, toRemove]
//         );
//       }

//       // add roles
//       for (const role_id of toAdd) {
//         await connection.query(
//           `
//           INSERT INTO user_roles (user_id, role_id)
//           VALUES (?, ?)
//           `,
//           [id, role_id]
//         );
//       }
//     }

//     // =========================
//     // 🔴 FORCE LOGOUT IF STATUS/ROLE CHANGED
//     // =========================

//     if (status || roles) {
//       await connection.query(
//         `
//         UPDATE users
//         SET token_version = token_version + 1
//         WHERE id = ?
//         `,
//         [id]
//       );
//     }

//     await connection.commit();

//     return { message: "User updated successfully" };

//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

export const updateUser = async (id, data, currentUserId) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const { username, email, phone, password, roles, status } =
      validateUpdateUser(data);

    await connection.beginTransaction();

    // 1️⃣ Check user exists
    const [[user]] = await connection.query(
      `SELECT id FROM users WHERE id = ?`,
      [id],
    );

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    // 2️⃣ Duplicate check
    if (username || email || phone) {
      const conditions = [];
      const values = [];

      if (username) {
        conditions.push("username = ?");
        values.push(username);
      }

      if (email) {
        conditions.push("email = ?");
        values.push(email);
      }

      if (phone) {
        conditions.push("phone = ?");
        values.push(phone);
      }

      const [dup] = await connection.query(
        `SELECT id FROM users WHERE (${conditions.join(" OR ")}) AND id != ?`,
        [...values, id],
      );

      if (dup.length) {
        throw { status: 409, message: "Duplicate user data" };
      }
    }

    // 3️⃣ Get ADMIN role (LOCK)
    const [[adminRole]] = await connection.query(
      `SELECT id FROM roles WHERE name = 'ADMIN' FOR UPDATE`,
    );

    const adminRoleId = adminRole?.id;

    // 4️⃣ Current user roles
    const [myRolesRows] = await connection.query(
      `
      SELECT r.name
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
      `,
      [currentUserId],
    );

    const isAdmin = myRolesRows.some((r) => r.name === "ADMIN");

    // =========================
    // 5️⃣ ROLE VALIDATION
    // =========================
    if (roles !== undefined) {
      if (!Array.isArray(roles) || roles.length === 0) {
        throw { status: 400, message: "roles[] required" };
      }

      // Check roles exist
      const [dbRoles] = await connection.query(
        `SELECT id FROM roles WHERE id IN (?)`,
        [roles],
      );

      if (dbRoles.length !== roles.length) {
        throw { status: 400, message: "Invalid role id(s)" };
      }

      // Only ADMIN can assign roles
      //   if (!isAdmin) {
      //     throw { status: 403, message: "Only ADMIN can assign roles" };
      //   }

      // Check if target user is ADMIN
      const [[isTargetAdmin]] = await connection.query(
        `SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?`,
        [id, adminRoleId],
      );

      // Prevent removing ADMIN
      if (isTargetAdmin && !roles.includes(adminRoleId)) {
        throw { status: 400, message: "Cannot remove ADMIN role" };
      }

      // Prevent multiple ADMIN
      if (roles.includes(adminRoleId)) {
        const [[count]] = await connection.query(
          `SELECT COUNT(*) as count FROM user_roles WHERE role_id = ? FOR UPDATE`,
          [adminRoleId],
        );

        if (count.count > 0 && !isTargetAdmin) {
          throw { status: 400, message: "Only one ADMIN allowed" };
        }
      }
    }

    // =========================
    // 6️⃣ UPDATE USER
    // =========================
    const fields = [];
    const values = [];

    if (username) {
      fields.push("username = ?");
      values.push(username);
    }

    if (email) {
      fields.push("email = ?");
      values.push(email);
    }

    if (phone) {
      fields.push("phone = ?");
      values.push(phone);
    }

    if (status) {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length) {
      await connection.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
        [...values, id],
      );
    }

    // 7️⃣ Password update
    if (password) {
      const hashed = await bcrypt.hash(password, 10);

      await connection.query(`UPDATE users SET password = ? WHERE id = ?`, [
        hashed,
        id,
      ]);
    }

    // =========================
    // 8️⃣ ROLE DIFF UPDATE
    // =========================
    if (roles !== undefined) {
      const [existingRows] = await connection.query(
        `SELECT role_id FROM user_roles WHERE user_id = ?`,
        [id],
      );

      const existing = existingRows.map((r) => r.role_id);

      const toAdd = roles.filter((r) => !existing.includes(r));
      const toRemove = existing.filter((r) => !roles.includes(r));

      if (toRemove.length) {
        await connection.query(
          `DELETE FROM user_roles WHERE user_id = ? AND role_id IN (?)`,
          [id, toRemove],
        );
      }

      for (const roleId of toAdd) {
        await connection.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [id, roleId],
        );
      }
    }

    // =========================
    // 9️⃣ FORCE LOGOUT
    // =========================
    if (status || roles !== undefined) {
      await connection.query(
        `UPDATE users SET token_version = token_version + 1 WHERE id = ?`,
        [id],
      );
    }

    await connection.commit();

    return { message: "User updated successfully" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const updateUserStatus = async (id, status) => {
  const db = getDB();

  if (!["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  const [result] = await db.query(
    `
    UPDATE users
    SET 
      status = ?,
      token_version = token_version + 1
    WHERE id = ?
    `,
    [status, id],
  );

  if (result.affectedRows === 0) {
    throw { status: 404, message: "User not found" };
  }

  return { message: `User ${status}` };
};

export const deleteUser = async (id) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Get ADMIN role id
    const [[adminRole]] = await connection.query(
      `SELECT id FROM roles WHERE name = 'ADMIN'`,
    );

    const adminRoleId = adminRole?.id;

    // 2️⃣ Check if user is ADMIN
    const [[isAdmin]] = await connection.query(
      `
      SELECT 1
      FROM user_roles
      WHERE user_id = ? AND role_id = ?
      `,
      [id, adminRoleId],
    );

    if (isAdmin) {
      throw {
        status: 403,
        message: "ADMIN user cannot be deleted",
      };
    }

    // 3️⃣ Delete user
    const [result] = await connection.query(`DELETE FROM users WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      throw { status: 404, message: "User not found" };
    }

    await connection.commit();

    return { message: "User deleted successfully" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getMyProfileService = async (userId) => {
  const db = getDB();

  // 1️⃣ Get user
  const [[user]] = await db.query(
    `
    SELECT id, username, email, phone, status, created_at
    FROM users
    WHERE id = ?
    `,
    [userId],
  );

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  if (user.status !== "active") {
    throw { status: 403, message: "User inactive" };
  }

  // 2️⃣ Get roles
  const [roles] = await db.query(
    `
    SELECT r.id, r.name
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
    `,
    [userId],
  );

  user.roles = roles.map((r) => r.name);

  return user;
};
