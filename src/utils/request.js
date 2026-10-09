import { v4 as uuidv4 } from "uuid";
import { getClientIp } from "./ip.js";
import { getDeviceInfo } from "./device.js";

/**
 * Extract complete HTTP request audit metadata
 *
 * @param {import("express").Request} req
 * @returns {{
 *   request_id: string,
 *   request_method: string,
 *   request_url: string,
 *   ip_address: string,
 *   user_agent: string,
 *   device_type: string,
 *   device_name: string,
 *   operating_system: string,
 *   browser: string,
 *   user_id: number | string | null,
 *   school_id: number | string | null
 * }}
 */
export const extractRequestInfo = (req) => {
  if (!req) {
    return {
      request_id: uuidv4(),
      request_method: "UNKNOWN",
      request_url: "",
      ip_address: "unknown",
      user_agent: "",
      device_type: "unknown",
      device_name: "unknown",
      operating_system: "unknown",
      browser: "unknown",
      user_id: null,
      school_id: null,
    };
  }

  // Ensure request has a persistent ID
  const requestId =
    req.id ||
    req.headers?.["x-request-id"] ||
    req.requestId ||
    uuidv4();

  const ipAddress = getClientIp(req);
  const deviceInfo = getDeviceInfo(req);

  return {
    request_id: String(requestId).substring(0, 100),
    request_method: (req.method || "GET").toUpperCase().substring(0, 20),
    request_url: (req.originalUrl || req.url || "").substring(0, 1000),
    ip_address: ipAddress.substring(0, 45),
    user_agent: deviceInfo.user_agent,
    device_type: deviceInfo.device_type.substring(0, 50),
    device_name: deviceInfo.device_name.substring(0, 255),
    operating_system: deviceInfo.operating_system.substring(0, 100),
    browser: deviceInfo.browser.substring(0, 100),
    user_id: req.user?.id || null,
    school_id: req.user?.school_id || null,
  };
};

export default extractRequestInfo;
