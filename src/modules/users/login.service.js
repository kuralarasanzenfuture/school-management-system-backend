import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../../config/db.js";
import { validateLoginUser } from "./user.validation.js";
import { UserModel } from "../users/user.model.js";
import { SessionModel } from "./session.model.js";



export const loginService = async (req) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const { login_id, password } = validateLoginUser(req.body);

    // 0️⃣ Get IP
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.ip;

    const userAgent = req.headers["user-agent"] || "unknown";

    // 1️⃣ Get user
    const user = await UserModel.findByLoginId(login_id);
    if (!user) throw { status: 400, message: "Invalid credentials" };

    if (user.status !== "active") {
      throw { status: 403, message: "User inactive" };
    }

    // 2️⃣ Password check
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw { status: 400, message: "Invalid credentials" };

    // 3️⃣ Get roles
    const roles = await UserModel.getUserRoles(user.id);

    const roleNames = roles.map((r) => r.name);

    // 4️⃣ Generate session
    const sessionId = uuidv4();

    const accessToken = jwt.sign(
      {
        id: user.id,
        roles: roleNames,
        token_version: user.token_version,
        session_id: sessionId,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        session_id: sessionId,
        token_version: user.token_version,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" },
    );

    // 🔐 HASH refresh token (IMPORTANT)
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await connection.beginTransaction();

    // 5️⃣ Save session
    await SessionModel.create(connection, {
      user_id: user.id,
      session_id: sessionId,
      refresh_token_hash: refreshTokenHash,
      token_version: user.token_version,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // 6️⃣ Update login time
    await connection.query(
      `UPDATE users SET last_login_at = NOW() WHERE id=?`,
      [user.id],
    );

    await connection.commit();

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        roles: roleNames,
      },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 🔥 1️⃣ LOGOUT (SINGLE DEVICE)
export const logoutService = async (req) => {
  const db = getDB();

  const token =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw { status: 400, message: "Refresh token required" };
  }

  // 🔐 hash token
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const [result] = await db.query(
    `
    UPDATE user_refresh_tokens
    SET 
      is_active = 0,
      revoked_at = NOW(),
      revoked_reason = 'logout'
    WHERE refresh_token_hash = ?
    `,
    [tokenHash]
  );

  if (result.affectedRows === 0) {
    throw { status: 400, message: "Session already invalid" };
  }

  return { message: "Logged out successfully" };
};

export const logoutAllService = async (req) => {
  const db = getDB();

  const userId = req.user.id; // from JWT middleware

  const [result] = await db.query(
    `
    UPDATE user_refresh_tokens
    SET 
      is_active = 0,
      revoked_at = NOW(),
      revoked_reason = 'logout_all'
    WHERE user_id = ?
      AND is_active = 1
    `,
    [userId]
  );

  // 🔥 OPTIONAL (STRONG SECURITY)
  await db.query(
    `
    UPDATE users
    SET token_version = token_version + 1
    WHERE id = ?
    `,
    [userId]
  );

  return {
    message: "Logged out from all devices",
    sessions_revoked: result.affectedRows
  };
};
