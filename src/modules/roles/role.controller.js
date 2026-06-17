import * as RoleService from "./role.service.js";

export const createRole = async (req, res) => {
  try {
    const result = await RoleService.createRole(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleService.getAllRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const result = await RoleService.updateRole(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const result = await RoleService.deleteRole(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateRoleStatus = async (req, res) => {
  try {
    const result = await RoleService.updateRoleStatus(
      req.params.id,
      req.body.status
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};