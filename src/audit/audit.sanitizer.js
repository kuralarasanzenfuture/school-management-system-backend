import { SENSITIVE_FIELDS } from "./audit.constants.js";

/**
 * Check if a field name matches sensitive patterns
 * @param {string} key
 * @returns {boolean}
 */
const isSensitiveKey = (key) => {
  if (!key || typeof key !== "string") return false;
  const lowerKey = key.toLowerCase();
  return SENSITIVE_FIELDS.some(
    (field) => lowerKey === field.toLowerCase() || lowerKey.includes("password") || lowerKey.includes("secret")
  );
};

/**
 * Deeply sanitizes data by redacting sensitive keys (passwords, tokens, secrets)
 *
 * @param {any} data
 * @param {string[]} [customSensitiveFields=[]]
 * @returns {any}
 */
export const sanitizeData = (data, customSensitiveFields = []) => {
  if (data === null || data === undefined) {
    return null;
  }

  // Handle primitives
  if (typeof data !== "object") {
    return data;
  }

  // Handle Dates
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, customSensitiveFields));
  }

  // Handle Objects
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key) || customSensitiveFields.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value, customSensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export default sanitizeData;
