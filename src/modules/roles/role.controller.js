import * as RoleService from "./role.service.js";
import { auditService } from "../../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_ENTITIES } from "../../audit/audit.constants.js";

/**
 * Controller for Roles
 * Adheres strictly to the architectural rule:
 * Controllers call auditService for audit logging, without directly querying audit_logs.
 */

export const createRole = async (req, res) => {
  try {
    const createdRole = await RoleService.createRole(req.body, req.user);

    // Call auditService to record creation audit log
    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.ROLES,
      entity_type: AUDIT_ENTITIES.ROLE,
      entity_id: createdRole.id,
      entity_name: createdRole.name,
      description: `Role '${createdRole.name}' (${createdRole.role_code}) created successfully`,
      new_data: createdRole,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: createdRole,
    });
  } catch (err) {
    // Optionally log failed attempt if it was a business validation or permission error
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.ROLES,
        entity_type: AUDIT_ENTITIES.ROLE,
        entity_name: req.body?.name || req.body?.role_name,
        description: `Failed to create role: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create role",
    });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const result = await RoleService.getAllRoles(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
      res.setHeader("X-Total-Pages", result.totalPages);

      return res.json({
        success: true,
        data: result.roles,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    }

    res.json({
      success: true,
      data: result.roles || result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch roles",
    });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await RoleService.getRoleById(req.params.id);
    res.json({
      success: true,
      data: role,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch role",
    });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { oldRole, updatedRole } = await RoleService.updateRole(
      req.params.id,
      req.body,
      req.user
    );

    // Call auditService to record update with field diffs
    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.ROLES,
      entity_type: AUDIT_ENTITIES.ROLE,
      entity_id: req.params.id,
      entity_name: updatedRole.name,
      description: `Role '${updatedRole.name}' updated`,
      old_data: oldRole,
      new_data: updatedRole,
    });

    res.json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update role",
    });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { deletedRole } = await RoleService.deleteRole(req.params.id, req.user);

    // Call auditService to record deletion
    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.ROLES,
      entity_type: AUDIT_ENTITIES.ROLE,
      entity_id: req.params.id,
      entity_name: deletedRole.name,
      description: `Role '${deletedRole.name}' deleted`,
      old_data: deletedRole,
    });

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete role",
    });
  }
};

export const updateRoleStatus = async (req, res) => {
  try {
    const { oldRole, updatedRole } = await RoleService.updateRoleStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    const action =
      updatedRole.status === "active"
        ? AUDIT_ACTIONS.ACTIVATE
        : AUDIT_ACTIONS.DEACTIVATE;

    // Call auditService to record activation / deactivation
    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.ROLES,
      entity_type: AUDIT_ENTITIES.ROLE,
      entity_id: req.params.id,
      entity_name: updatedRole.name,
      description: `Role '${updatedRole.name}' status changed to ${updatedRole.status}`,
      old_data: oldRole,
      new_data: updatedRole,
    });

    res.json({
      success: true,
      message: `Role and associated users ${updatedRole.status} successfully`,
      data: updatedRole,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update role status",
    });
  }
};

export const checkExistingRoleName = async (req, res) => {
  try {
    const data = {
      ...req.query,
      ...req.params,
    };
    const result = await RoleService.checkExistingRoleName(data);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check role name",
    });
  }
};