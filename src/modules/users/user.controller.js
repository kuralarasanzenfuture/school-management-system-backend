import * as UserService from "./user.service.js";
import {
  loginService,
  logoutAllService,
  logoutService,
} from "./login.service.js";
import { setAuthCookies } from "../../utils/cookies.js";
import { refreshTokenService } from "./refreshToken.service.js";
import { clearAuthCookies } from "../../utils/clearCookies.js";
import { validateChangePassword } from "./user.validation.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

export const createUser = async (req, res) => {
  try {
    const result = await UserService.createUser(req.body);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.USERS,
      entity_type: AUDIT_ENTITIES.USER,
      entity_id: result.user_id,
      entity_name: result.user?.username || req.body?.username,
      description: `User '${result.user?.username || req.body?.username}' created successfully`,
      new_data: result.user,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.USERS,
        entity_type: AUDIT_ENTITIES.USER,
        entity_name: req.body?.username,
        description: `Failed to create user: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    // console.log("login BODY:", req.body);
    const result = await loginService(req);

    // 🍪 SET COOKIES
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const result = await refreshTokenService(req);

    // 🍪 SET NEW COOKIES
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.json({
      success: true,
      message: "Token refreshed",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    console.error(err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    // 🔥 priority: token → param
    const userId = req.user?.id || req.params?.id;

    if (!userId) {
      return res.status(400).json({
        message: "User ID required",
      });
    }

    const profile = await UserService.getMyProfileService(userId);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await UserService.getAllUsers(req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.users || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const getAllUsersByToken = async (req, res) => {
  try {
    const result = await UserService.getAllUsersByToken(req.user, req.query);

    if (result.total !== undefined) {
      res.setHeader("X-Total-Count", result.total);
      res.setHeader("X-Page", result.page);
      res.setHeader("X-Limit", result.limit);
    }

    res.json({
      success: true,
      data: result.users || result,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const data = await UserService.getUserById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const result = await UserService.updateUser(
      req.params.id,
      req.body,
      req.user?.id
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.USERS,
      entity_type: AUDIT_ENTITIES.USER,
      entity_id: req.params.id,
      entity_name: result.updatedUser?.username || result.oldUser?.username,
      description: `User '${result.updatedUser?.username || result.oldUser?.username}' updated successfully`,
      old_data: result.oldUser,
      new_data: result.updatedUser,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedUser,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const result = await UserService.updateUserStatus(
      req.params.id,
      req.body.status
    );

    const action =
      req.body.status === "active"
        ? AUDIT_ACTIONS.ACTIVATE
        : AUDIT_ACTIONS.DEACTIVATE;

    await auditService.logAction({
      req,
      action,
      module: AUDIT_MODULES.USERS,
      entity_type: AUDIT_ENTITIES.USER,
      entity_id: req.params.id,
      entity_name: result.updatedUser?.username || result.oldUser?.username,
      description: `User '${result.updatedUser?.username || result.oldUser?.username}' status changed to ${req.body.status}`,
      old_data: result.oldUser,
      new_data: result.updatedUser,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.updatedUser,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await UserService.deleteUser(req.params.id);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.USERS,
      entity_type: AUDIT_ENTITIES.USER,
      entity_id: req.params.id,
      entity_name: result.deletedUser?.username,
      description: `User '${result.deletedUser?.username}' deleted successfully`,
      old_data: result.deletedUser,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const checkUsername = async (req, res) => {
  try {
    // const result = await UserService.checkUsername(req.body.username);
    const result = await UserService.checkUsername(req.params.username);
    // const result = await UserService.checkUsername(req.query.username);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkEmail = async (req, res) => {
  try {
    // const result = await UserService.checkEmail(req.body.email);
    const result = await UserService.checkEmail(req.params.email);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkPhone = async (req, res) => {
  try {
    // const result = await UserService.checkPhone(req.body.phone);
    const result = await UserService.checkPhone(req.params.phone);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const result = await logoutService(req);

    // 🍪 clear cookies
    clearAuthCookies(res);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

export const logoutAllDevices = async (req, res) => {
  try {
    const result = await logoutAllService(req);

    clearAuthCookies(res);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

export const changePassword = async (req, res) => {
  // console.log("req.user =>", req.user);
  try {
    const errors = validateChangePassword(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    const { currentPassword, newPassword } = req.body;

    const result = await UserService.changePasswordService(
      req.user.id,
      currentPassword,
      newPassword,
    );

    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
