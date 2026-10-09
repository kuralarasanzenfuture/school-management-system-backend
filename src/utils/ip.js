/**
 * Extract client IP address from Express request
 * Handles reverse proxies, load balancers, and IPv6 mapping
 *
 * @param {import("express").Request} req
 * @returns {string}
 */
export const getClientIp = (req) => {
  if (!req) return "unknown";

  const forwarded = req.headers?.["x-forwarded-for"];
  let ip = "";

  if (forwarded) {
    // If multiple IPs are forwarded, take the first (client) one
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    ip = ips.split(",")[0].trim();
  } else if (req.headers?.["x-real-ip"]) {
    ip = req.headers["x-real-ip"];
  } else if (req.headers?.["cf-connecting-ip"]) {
    // Cloudflare connecting IP
    ip = req.headers["cf-connecting-ip"];
  } else if (req.ip) {
    ip = req.ip;
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  } else if (req.connection?.remoteAddress) {
    ip = req.connection.remoteAddress;
  }

  // Handle IPv6 mapped IPv4 (e.g., ::ffff:127.0.0.1)
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // Handle localhost IPv6
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip || "unknown";
};

export default getClientIp;
