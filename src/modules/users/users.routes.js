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
  getAllUsersByToken,
  changePassword,
} from "./user.controller.js";

import { verifyToken, adminOnly } from "../../middlewares/auth.middleware.js";

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
router.get("/me/:id", verifyToken, adminOnly, getMyProfile);

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

// 🔴 ONLY ADMIN CAN CREATE VIA POST /
router.post("/", verifyToken, adminOnly, createUser);

// 🔴 ONLY ADMIN CAN SEE ALL USERS
router.get("/", verifyToken, adminOnly, getAllUsers);
router.get("/token", verifyToken, getAllUsersByToken);

// 🔴 ADMIN + SELF ACCESS
router.get("/:id", verifyToken, getUserById);

// 🔴 ADMIN ONLY
router.put("/update/:id", verifyToken, adminOnly, updateUser);

router.put("/change-password", verifyToken, changePassword);

// 🔴 ADMIN ONLY
router.patch("/status/:id", verifyToken, adminOnly, updateUserStatus);

// 🔴 ADMIN ONLY
router.delete("/delete/:id", verifyToken, adminOnly, deleteUser);

export default router;
