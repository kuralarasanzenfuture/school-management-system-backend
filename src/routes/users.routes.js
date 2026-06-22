import express from "express";
import {
  loginUser,
  refreshToken,
  getMyProfile,
  logoutUser,
  logoutAllDevices,
  checkUsername,
  checkEmail,
  checkPhone,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  createUser,
} from "../modules/users/user.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", createUser);

/* =========================
   AUTH
========================= */
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);

/* =========================
   PROFILE
========================= */
// 🔐 Logged-in user
router.get("/me", verifyToken, getMyProfile);

// 🔐 Admin only (optional)
router.get("/:id", verifyToken, getMyProfile);

/* =========================
   LOGOUT
========================= */
router.post("/logout", verifyToken, logoutUser);
router.post("/logout-all", verifyToken, logoutAllDevices);

/* =========================
   VALIDATION (PUBLIC)
========================= */
router.get("/check-username/:username", checkUsername);
router.get("/check-email/:email", checkEmail);
router.get("/check-phone/:phone", checkPhone);

/* =========================
   USER CRUD (PROTECTED)
========================= */

// 🔴 ONLY ADMIN CAN SEE ALL USERS
router.get("/", getAllUsers);

// // 🔴 ADMIN + SELF ACCESS
router.get("/:id", getUserById);

// 🔴 ADMIN ONLY
router.put("/update/:id", updateUser);

// 🔴 ADMIN ONLY
router.patch("/status/:id", updateUserStatus);

// 🔴 ADMIN ONLY
router.delete("/delete/:id", deleteUser);

export default router;
