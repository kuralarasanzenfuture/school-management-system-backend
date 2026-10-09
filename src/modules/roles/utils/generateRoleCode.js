/**
 * Role Code Utilities
 */

/**
 * Validates role_code format
 * @param {string} roleCode
 * @returns {string}
 */
export const validateRoleCode = (roleCode) => {
  if (!roleCode || typeof roleCode !== "string") {
    throw { status: 400, message: "role_code is required" };
  }

  const code = roleCode.trim().toUpperCase();

  if (code.length < 2 || code.length > 50) {
    throw { status: 400, message: "Role code must be between 2 and 50 characters" };
  }

  if (!/^[A-Z0-9_]+$/.test(code)) {
    throw {
      status: 400,
      message: "Role code must contain only uppercase letters, numbers, and underscores (no spaces)",
    };
  }

  return code;
};

/**
 * Generates and validates role_code automatically from role name
 * e.g., "Senior Teacher" -> "SENIOR_TEACHER"
 * @param {string} name
 * @returns {string}
 */
export const generateRoleCode = (name) => {
  if (!name || typeof name !== "string") {
    throw { status: 400, message: "Role name is required to generate role code" };
  }

  const code = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return validateRoleCode(code);
};

export default generateRoleCode;
