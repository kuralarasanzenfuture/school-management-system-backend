import * as UserService from "./user.service.js";
import { loginService, logoutAllService, logoutService } from "./login.service.js";
import { setAuthCookies } from "../../utils/cookies.js";
import { refreshTokenService } from "./refreshToken.service.js";
import { clearAuthCookies } from "../../utils/clearCookies.js";

export const createUser = async (req, res) => {
  try {
    const result = await UserService.createUser(req.body);
    // console.log(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    console.log("login BODY:", req.body);
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
    const data = await UserService.getAllUsers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const data = await UserService.getUserById(req.params.id, req.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const result = await UserService.updateUser(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const result = await UserService.updateUserStatus(
      req.params.id,
      req.body.status,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await UserService.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkUsername = async (req, res) => {
  try {
    // const result = await UserService.checkUsername(req.body.username);
    // const result = await UserService.checkUsername(req.params.username);
    const result = await UserService.checkUsername(req.query.username);
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
