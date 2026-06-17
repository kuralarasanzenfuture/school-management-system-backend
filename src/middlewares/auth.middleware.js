import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// export const verifyToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     // console.log("AUTH HEADER:", authHeader);

//     // if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     //   return res.status(401).json({ message: "Unauthorized" });
//     // }

//     if (!authHeader) {
//       return res.status(401).json({
//         message: "Authorization header missing",
//       });
//     }

//     if (!authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Invalid authorization format. Use: Bearer <token>",
//       });
//     }

//     // const parts = authHeader.split(" ");

//     // if (parts.length !== 2) {
//     //   return res.status(401).json({
//     //     message: "Invalid authorization format. Expected: Bearer <token>",
//     //   });
//     // }

//     // const [scheme, token] = parts;

//     // if (scheme !== "Bearer") {
//     //   return res.status(401).json({
//     //     message: `Invalid auth scheme '${scheme}'. Expected 'Bearer'`,
//     //   });
//     // }

//     // if (!token) {
//     //   return res.status(401).json({
//     //     message: "Token missing after Bearer",
//     //   });
//     // }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, ACCESS_SECRET);

//     // 🔥 CHECK USER STATUS + TOKEN VERSION
//     const [[user]] = await db.query(
//       `SELECT status, token_version FROM users WHERE id=?`,
//       [decoded.id],
//     );

//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     if (user.status !== "active") {
//       return res.status(403).json({
//         message: "User is inactive",
//       });
//     }

//     if (user.token_version !== decoded.token_version) {
//       return res.status(401).json({
//         message: "Session expired (forced logout)",
//       });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       message: "Invalid or expired token",
//     });
//   }
// };

// export const verifyToken = async (req, res, next) => {
//   try {
//     const db = await getDB();
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({
//         message: "Authorization header missing",
//       });
//     }

//     if (!authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Invalid authorization format",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

//     // ✅ FIXED TABLE
//     const [[user]] = await db.query(
//       `SELECT status, token_version FROM users WHERE id=?`,
//       [decoded.id],
//     );

//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     if (user.status !== "active") {
//       return res.status(403).json({
//         message: "User inactive",
//       });
//     }

//     // if (user.token_version !== decoded.token_version) {
//     //   return res.status(401).json({
//     //     message: "Session expired (forced logout)",
//     //   });
//     // }

    

//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error("VERIFY ERROR:", err.message);

//     return res.status(401).json({
//       message: "Invalid or expired token",
//     });
//   }
// };


export const verifyToken = async (req, res, next) => {
  try {
    const db = getDB();

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ✅ 1. Check user
    const [[user]] = await db.query(
      `SELECT status, token_version FROM users WHERE id=?`,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "User inactive" });
    }

    // ✅ 2. Token version check
    if (decoded.token_version !== user.token_version) {
      return res.status(401).json({
        message: "Session expired (forced logout)",
      });
    }

    // ✅ 3. SESSION VALIDATION (IMPORTANT 🔥)
    const [[session]] = await db.query(
      `
      SELECT id FROM user_refresh_tokens
      WHERE user_id = ?
        AND session_id = ?
        AND is_active = 1
        AND expires_at > NOW()
      `,
      [decoded.id, decoded.session_id]
    );

    if (!session) {
      return res.status(401).json({
        message: "Session expired or logged out",
      });
    }

    req.user = decoded;
    next();

  } catch (err) {
    console.error("VERIFY ERROR:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

