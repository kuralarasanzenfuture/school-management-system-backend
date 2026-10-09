/**
 * Device and browser detection utility from User-Agent string
 *
 * @param {import("express").Request} req
 * @returns {{
 *   device_type: string,
 *   device_name: string,
 *   operating_system: string,
 *   browser: string,
 *   user_agent: string
 * }}
 */
export const getDeviceInfo = (req) => {
  const ua = req?.headers?.["user-agent"] || "";

  if (!ua) {
    return {
      device_type: "unknown",
      device_name: "Unknown Device",
      operating_system: "Unknown OS",
      browser: "Unknown Browser",
      user_agent: "",
    };
  }

  // Detect Postman / Curl / API tools
  if (/postman/i.test(ua)) {
    return {
      device_type: "desktop",
      device_name: "Postman Client",
      operating_system: "API Client",
      browser: "Postman",
      user_agent: ua.substring(0, 1000),
    };
  }

  if (/curl/i.test(ua)) {
    return {
      device_type: "desktop",
      device_name: "cURL Client",
      operating_system: "CLI",
      browser: "curl",
      user_agent: ua.substring(0, 1000),
    };
  }

  // 1. Operating System
  let os = "Unknown OS";
  if (/windows nt 10\.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6\.2/i.test(ua)) os = "Windows 8";
  else if (/windows nt 6\.1/i.test(ua)) os = "Windows 7";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/cros/i.test(ua)) os = "Chrome OS";
  else if (/linux/i.test(ua)) os = "Linux";

  // 2. Device Type
  let deviceType = "desktop";
  let deviceName = "PC";

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = "tablet";
    deviceName = /ipad/i.test(ua) ? "Apple iPad" : "Tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = "mobile";
    if (/iphone/i.test(ua)) deviceName = "Apple iPhone";
    else if (/android/i.test(ua)) deviceName = "Android Device";
    else deviceName = "Mobile Device";
  } else if (/bot|crawler|spider|googlebot|bingbot|slurp/i.test(ua)) {
    deviceType = "bot";
    deviceName = "Web Crawler / Bot";
  } else {
    deviceType = "desktop";
    if (/macintosh/i.test(ua)) deviceName = "Apple Mac";
    else if (/windows/i.test(ua)) deviceName = "Windows PC";
    else if (/linux/i.test(ua)) deviceName = "Linux PC";
    else deviceName = "Desktop";
  }

  // 3. Browser
  let browser = "Unknown Browser";
  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = "Apple Safari";
  else if (/msie|trident/i.test(ua)) browser = "Internet Explorer";

  return {
    device_type: deviceType,
    device_name: deviceName,
    operating_system: os,
    browser: browser,
    user_agent: ua.substring(0, 1000),
  };
};

export default getDeviceInfo;
