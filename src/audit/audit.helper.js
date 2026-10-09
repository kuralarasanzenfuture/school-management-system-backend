import { AUDIT_ACTIONS } from "./audit.constants.js";

/**
 * Converts a snake_case or camelCase field name into a human-readable label
 * E.g., 'role_code' -> 'Role Code', 'is_system' -> 'Is System'
 *
 * @param {string} fieldName
 * @returns {string}
 */
export const formatFieldLabel = (fieldName) => {
  if (!fieldName || typeof fieldName !== "string") return "";

  return fieldName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

/**
 * Safely stringifies any value for storage in TEXT columns (old_value, new_value)
 *
 * @param {any} value
 * @returns {string | null}
 */
export const stringifyValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

/**
 * Determines data type description for audit change
 *
 * @param {any} value
 * @returns {string}
 */
export const getDataType = (value) => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  return typeof value;
};

/**
 * Infers default audit action from HTTP request method
 *
 * @param {string} method
 * @returns {string}
 */
export const inferActionFromMethod = (method) => {
  const m = (method || "").toUpperCase();
  switch (m) {
    case "POST":
      return AUDIT_ACTIONS.CREATE;
    case "PUT":
    case "PATCH":
      return AUDIT_ACTIONS.UPDATE;
    case "DELETE":
      return AUDIT_ACTIONS.DELETE;
    case "GET":
      return AUDIT_ACTIONS.VIEW;
    default:
      return AUDIT_ACTIONS.UPDATE;
  }
};
