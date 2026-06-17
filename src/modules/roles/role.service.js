// import { getDB } from "../../config/db.js";

// export const createRole = async ({ role_name, role_description }) => {
//   const db = getDB();

//   if (!role_name) {
//     throw { status: 400, message: "role_name is required" };
//   }

//   role_name = role_name.trim().toUpperCase();

//   if (!/^[A-Z_]+$/.test(role_name)) {
//     throw { status: 400, message: "Invalid role format" };
//   }

//   if (role_name === "ADMIN") {
//     throw { status: 403, message: "ADMIN is protected" };
//   }

//   const [exist] = await db.query(
//     "SELECT id FROM role_based WHERE role_name = ?",
//     [role_name]
//   );

//   if (exist.length) {
//     throw { status: 409, message: "Role already exists" };
//   }

//   await db.query(
//     "INSERT INTO role_based (role_name, role_description) VALUES (?, ?)",
//     [role_name, role_description]
//   );

//   return { message: "Role created" };
// };

/* 3. SERVICE (CONNECTS VALIDATION + MODEL) */

// import { RoleModel } from "./role.model.js";
// import {
//   validateCreateRole,
//   validateUpdateRole,
// } from "./role.validation.js";

// export const createRole = async (data) => {
//   const validated = validateCreateRole(data);

//   const existing = await RoleModel.findByName(validated.role_name);
//   if (existing) {
//     throw { status: 409, message: "Role already exists" };
//   }

//   await RoleModel.create(validated);

//   return { message: "Role created successfully" };
// };

/*----------------------------------------------------------------------*/

import { RoleModel } from "./role.model.js";
import { validateRoleName, validateStatus } from "./role.validation.js";
import { getDB as db } from "../../config/db.js";

export const createRole = async (data) => {
  let { name, description } = data;

  name = validateRoleName(name);

  const exists = await RoleModel.findByName(name);
  if (exists) throw { status: 409, message: "Role already exists" };

  await RoleModel.create(name, description);

  return { message: "Role created successfully" };
};

export const getAllRoles = async () => {
  return await RoleModel.findAll();
};

export const updateRole = async (id, data) => {
  let { name, description, status } = data;

  name = validateRoleName(name);
  status = validateStatus(status) || "active";

  const role = await RoleModel.findById(id);
  if (!role) throw { status: 404, message: "Role not found" };

  if (role.role_name === "ADMIN") {
    throw { status: 403, message: "ADMIN cannot be modified" };
  }

  const exists = await RoleModel.findByName(name);
  if (exists && exists.id !== Number(id)) {
    throw { status: 409, message: "Role already exists" };
  }

  await RoleModel.update(id, name, description, status);

  return { message: "Role updated" };
};

export const deleteRole = async (id) => {
  const role = await RoleModel.findById(id);
  if (!role) throw { status: 404, message: "Role not found" };

  if (role.name === "ADMIN") {
    throw { status: 403, message: "Cannot delete ADMIN" };
  }

  const assigned = await RoleModel.countAssignedUsers(id);
  if (assigned > 0) {
    throw {
      status: 400,
      message: `${assigned} users assigned to this role`,
    };
  }

  await RoleModel.delete(id);

  return { message: "Role deleted successfully" };
};

export const updateRoleStatus = async (id, status) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    status = validateStatus(status);

    await connection.beginTransaction();

    // 1️⃣ Get role
    const [[role]] = await connection.query(
      `SELECT id, name, status FROM roles WHERE id=?`,
      [id],
    );

    if (!role) throw { status: 404, message: "Role not found" };

    if (role.name === "ADMIN") {
      throw { status: 403, message: "ADMIN cannot be modified" };
    }

    if (role.status === status) {
      throw { status: 400, message: `Role already ${status}` };
    }

    // 2️⃣ Update role
    await connection.query(`UPDATE roles SET status=? WHERE id=?`, [
      status,
      id,
    ]);

    // 3️⃣ Update USERS (through JOIN 🔥)
    await connection.query(
      `
      UPDATE users u
      JOIN user_roles ur ON u.id = ur.user_id
      SET 
        u.status = ?,
        u.token_version = u.token_version + 1
      WHERE ur.role_id = ?
      `,
      [status, id],
    );

    await connection.commit();

    return { message: `Role and users ${status} successfully` };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
