/**
 * Audit Log Constants
 * Matches MySQL audit_logs ENUM specifications
 */

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  RESTORE: "RESTORE",
  ACTIVATE: "ACTIVATE",
  DEACTIVATE: "DEACTIVATE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET: "PASSWORD_RESET",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  SUBMIT: "SUBMIT",
  CANCEL: "CANCEL",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  DOWNLOAD: "DOWNLOAD",
  UPLOAD: "UPLOAD",
  PRINT: "PRINT",
  VIEW: "VIEW",
});

export const AUDIT_STATUS = Object.freeze({
  SUCCESS: "success",
  FAILED: "failed",
});

export const AUDIT_MODULES = Object.freeze({
  ROLES: "roles",
  USERS: "users",
  SCHOOLS: "schools",
  DEPARTMENTS: "departments",
  ACADEMIC_YEARS: "academic_years",
  CLASSES: "classes",
  SECTIONS: "sections",
  CLASS_SECTIONS: "class_sections",
  STUDENTS: "students",
  STUDENT_ADMISSIONS: "student_admissions",
  STUDENT_ATTENDANCE: "student_attendance",
  EMPLOYEES: "employees",
  EMPLOYEE_ATTENDANCE: "employee_attendance",
  EMPLOYEE_SHIFTS: "employee_shifts",
  EMPLOYEE_LEAVE: "employee_leave",
  EMPLOYEE_PAYROLL: "employee_payroll",
  SUBJECTS: "subjects",
  AUTH: "auth",
});

export const AUDIT_ENTITIES = Object.freeze({
  ROLE: "role",
  USER: "user",
  SCHOOL: "school",
  DEPARTMENT: "department",
  ACADEMIC_YEAR: "academic_year",
  CLASS: "class",
  SECTION: "section",
  STUDENT: "student",
  EMPLOYEE: "employee",
  SUBJECT: "subject",
});

export const SENSITIVE_FIELDS = Object.freeze([
  "password",
  "password_hash",
  "token",
  "token_version",
  "accessToken",
  "refreshToken",
  "refresh_token",
  "access_token",
  "secret",
  "otp",
  "session_id",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "authorization",
  "cookie",
]);
