import { RoleModel } from "./role.model.js";
import {
  validateCreateRole,
  validateUpdateRole,
  validateRoleFilters,
  validateStatus,
} from "./role.validation.js";
import { getDB } from "../../config/db.js";

/**
 * Role Service - Business Logic for Roles
 */

export const createRole = async (data, currentUser = null) => {
  const validated = validateCreateRole(data);

  // Check unique name
  const existingName = await RoleModel.findByName(validated.name);
  if (existingName) {
    throw { status: 409, message: `Role name '${validated.name}' already exists` };
  }

  // Check unique role_code
  const existingCode = await RoleModel.findByRoleCode(validated.role_code);
  if (existingCode) {
    throw { status: 409, message: `Role code '${validated.role_code}' already exists` };
  }

  const rolePayload = {
    ...validated,
    created_by: currentUser?.id || null,
  };

  const insertId = await RoleModel.create(rolePayload);
  const createdRole = await RoleModel.findById(insertId);

  return createdRole;
};

export const getAllRoles = async (query = {}) => {
  const filters = validateRoleFilters(query);
  return await RoleModel.findAll(filters);
};

export const getRoleById = async (id) => {
  const role = await RoleModel.findById(id);
  if (!role) {
    throw { status: 404, message: "Role not found" };
  }
  return role;
};

export const updateRole = async (id, data, currentUser = null) => {
  const existingRole = await RoleModel.findById(id);
  if (!existingRole) {
    throw { status: 404, message: "Role not found" };
  }

  const validated = validateUpdateRole(data);

  // System role protection
  if (existingRole.is_system === 1 || Number(id) === 1 || existingRole.name === "ADMIN") {
    if (validated.name && validated.name !== existingRole.name) {
      throw { status: 403, message: "System role name cannot be modified" };
    }
    if (validated.role_code && validated.role_code !== existingRole.role_code) {
      throw { status: 403, message: "System role code cannot be modified" };
    }
  }

  // Check unique name
  if (validated.name && validated.name !== existingRole.name) {
    const duplicateName = await RoleModel.findByName(validated.name);
    if (duplicateName && duplicateName.id !== Number(id)) {
      throw { status: 409, message: `Role name '${validated.name}' is already in use` };
    }
  }

  // Check unique role_code
  if (validated.role_code && validated.role_code !== existingRole.role_code) {
    const duplicateCode = await RoleModel.findByRoleCode(validated.role_code);
    if (duplicateCode && duplicateCode.id !== Number(id)) {
      throw { status: 409, message: `Role code '${validated.role_code}' is already in use` };
    }
  }

  const updatePayload = {
    ...validated,
    updated_by: currentUser?.id || null,
  };

  await RoleModel.update(id, updatePayload);
  const updatedRole = await RoleModel.findById(id);

  return {
    oldRole: existingRole,
    updatedRole,
  };
};

export const deleteRole = async (id, currentUser = null) => {
  const existingRole = await RoleModel.findById(id);
  if (!existingRole) {
    throw { status: 404, message: "Role not found" };
  }

  if (existingRole.is_system === 1 || Number(id) === 1 || existingRole.name === "ADMIN") {
    throw { status: 403, message: "System roles cannot be deleted" };
  }

  const assignedUsers = await RoleModel.countAssignedUsers(id);
  if (assignedUsers > 0) {
    throw {
      status: 400,
      message: `Cannot delete role '${existingRole.name}'. It is currently assigned to ${assignedUsers} active user(s).`,
    };
  }

  await RoleModel.delete(id);

  return {
    deletedRole: existingRole,
  };
};

export const updateRoleStatus = async (id, status, currentUser = null) => {
  const validStatus = validateStatus(status);
  if (!validStatus) {
    throw { status: 400, message: "Valid status ('active' or 'inactive') is required" };
  }

  const existingRole = await RoleModel.findById(id);
  if (!existingRole) {
    throw { status: 404, message: "Role not found" };
  }

  if ((existingRole.is_system === 1 || Number(id) === 1) && validStatus === "inactive") {
    throw { status: 403, message: "ADMIN / System roles cannot be deactivated" };
  }

  if (existingRole.status === validStatus) {
    throw { status: 400, message: `Role '${existingRole.name}' is already ${validStatus}` };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await RoleModel.update(
      id,
      { status: validStatus, updated_by: currentUser?.id || null },
      conn
    );

    // Cascade status change to users assigned to this role
    await RoleModel.cascadeUsersStatus(id, validStatus, conn);

    await conn.commit();

    const updatedRole = await RoleModel.findById(id);

    return {
      oldRole: existingRole,
      updatedRole,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingRoleName = async (data = {}) => {
  const db = getDB();

  const name = data.name || data.role_name;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "name is required" };
  }

  const trimmedName = name.trim().toUpperCase();
  const excludeId = data.exclude_id || data.excludeId || data.id;

  let sql = `
    SELECT id, name, role_code, is_system, status
    FROM roles
    WHERE UPPER(name) = ?
  `;
  const params = [trimmedName];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(Number(excludeId));
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    role: existing || null,
  };
};
