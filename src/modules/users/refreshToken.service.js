import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getDB } from "../../config/db.js";

// export const refreshTokenService = async (req) => {
//   const db = getDB();

//   // 🔥 1. GET TOKEN (cookie OR body)
//   //   const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

//   let incomingToken = null;

//   // Priority → Authorization header (best)
//   const authHeader = req.headers.authorization;

//   if (authHeader && authHeader.startsWith("Bearer ")) {
//     incomingToken = authHeader.split(" ")[1];
//   }

//   // Then cookie
//   if (!incomingToken && req.cookies?.refreshToken) {
//     incomingToken = req.cookies.refreshToken;
//   }

//   // Then body
//   if (!incomingToken && req.body?.refreshToken) {
//     incomingToken = req.body.refreshToken;
//   }

//   if (!incomingToken) {
//     throw { status: 400, message: "Refresh token required" };
//   }

//   if (!incomingToken) {
//     throw { status: 400, message: "Refresh token required" };
//   }

//   let decoded;

//   try {
//     decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
//   } catch {
//     throw { status: 403, message: "Invalid or expired token" };
//   }

//   console.log("Incoming token:", incomingToken);

//   // 🔐 2. HASH TOKEN (IMPORTANT)
//   const tokenHash = crypto
//     .createHash("sha256")
//     .update(incomingToken)
//     .digest("hex");

//   console.log("Token hash:", tokenHash);

//   // 🔍 3. CHECK DB SESSION
//   const [[session]] = await db.query(
//     `
//   SELECT * FROM user_refresh_tokens
//   WHERE refresh_token_hash = ?
//     AND user_id = ?
//     AND session_id = ?
//     AND is_active = 1
//     AND expires_at > NOW()
//   `,
//     [tokenHash, decoded.id, decoded.session_id],
//   );

//   console.log("Session:", session);

//   if (!session) {
//     throw { status: 403, message: "Session invalid or expired" };
//   }

//   // ✅ USER CHECK
//   const [[user]] = await db.query(
//     `SELECT status, token_version FROM users WHERE id=?`,
//     [decoded.id],
//   );

//   if (!user) {
//     throw { status: 401, message: "User not found" };
//   }

//   if (user.status !== "active") {
//     throw { status: 403, message: "User inactive" };
//   }

//   if (decoded.token_version !== user.token_version) {
//     throw { status: 401, message: "Session expired (forced logout)" };
//   }

//   // 🔁 4. GENERATE NEW TOKENS
//   const newAccessToken = jwt.sign(
//     {
//       id: decoded.id,
//       session_id: decoded.session_id,
//     },
//     process.env.JWT_ACCESS_SECRET,
//     { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" },
//   );

//   const newRefreshToken = jwt.sign(
//     {
//       id: decoded.id,
//       session_id: decoded.session_id,
//     },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" },
//   );

//   // 🔐 HASH NEW TOKEN
//   const newHash = crypto
//     .createHash("sha256")
//     .update(newRefreshToken)
//     .digest("hex");

//   // 🔄 5. ROTATE TOKEN (CRITICAL SECURITY)
//   await db.query(
//     `UPDATE user_refresh_tokens
//      SET is_active = 0, revoked_at = NOW()
//      WHERE refresh_token_hash = ?`,
//     [tokenHash],
//   );

//   await db.query(
//     `
//     INSERT INTO user_refresh_tokens
//     (user_id, session_id, refresh_token_hash, ip_address, user_agent, expires_at)
//     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
//     `,
//     [
//       decoded.id,
//       decoded.session_id,
//       newHash,
//       req.ip,
//       req.headers["user-agent"] || "unknown",
//     ],
//   );

//   return {
//     accessToken: newAccessToken,
//     refreshToken: newRefreshToken,
//   };
// };

/*------------------------------------------------------------------------------*/

export const refreshTokenService = async (req) => {
  const db = getDB();

//   console.log("HEADER:", req.headers.authorization);
//   console.log("COOKIE:", req.cookies?.refreshToken);
//   console.log("BODY:", req.body);

  let incomingToken = null;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    incomingToken = authHeader.split(" ")[1];
  }

  if (!incomingToken && req.cookies?.refreshToken) {
    incomingToken = req.cookies.refreshToken;
  }

  if (!incomingToken && req.body?.refreshToken) {
    incomingToken = req.body.refreshToken;
  }

  if (!incomingToken) {
    throw { status: 400, message: "Refresh token required" };
  }

  let decoded;

  try {
    decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw { status: 403, message: "Invalid or expired token" };
  }

  // 🔐 HASH TOKEN
  const tokenHash = crypto
    .createHash("sha256")
    .update(incomingToken)
    .digest("hex");

  // 🔍 CHECK SESSION
  const [[session]] = await db.query(
    `
    SELECT * FROM user_refresh_tokens
    WHERE refresh_token_hash = ?
      AND user_id = ?
      AND session_id = ?
      AND is_active = 1
      AND expires_at > NOW()
    `,
    [tokenHash, decoded.id, decoded.session_id],
  );

  if (!session) {
    throw { status: 403, message: "Session invalid or expired" };
  }

  // ✅ USER CHECK
  const [[user]] = await db.query(
    `SELECT status, token_version FROM users WHERE id=?`,
    [decoded.id],
  );

  if (!user) throw { status: 401, message: "User not found" };

  if (user.status !== "active") {
    throw { status: 403, message: "User inactive" };
  }

  // 🔁 NEW TOKENS
  const newAccessToken = jwt.sign(
    {
      id: decoded.id,
      session_id: decoded.session_id,
      token_version: user.token_version,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" },
  );

  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
      session_id: decoded.session_id,
      token_version: user.token_version,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" },
  );

  const newHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // deactivate old
    await connection.query(
      `
      UPDATE user_refresh_tokens
      SET is_active = 0, revoked_at = NOW()
      WHERE refresh_token_hash = ?
      `,
      [tokenHash],
    );

    // insert new
    await connection.query(
      `
      INSERT INTO user_refresh_tokens
      (user_id, session_id, refresh_token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `,
      [
        decoded.id,
        decoded.session_id,
        newHash,
        req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.socket?.remoteAddress ||
          req.ip,
        req.headers["user-agent"] || "unknown",
      ],
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
