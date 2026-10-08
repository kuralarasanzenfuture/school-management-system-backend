import { getDB } from "../../../config/db.js";
import getFilePath from "../../../utils/getFilePath.js";
import { deleteUploadedFile, deleteUploadedFiles } from "../../../utils/fileStorage.js";
import { UserModel } from "../../users/user.model.js";
import { EmployeeModel } from "./employee.model.js";
import { EmployeeDocumentModel } from "./employee.model.js";
import {
  validateAssignUser,
  validateCreateEmployee,
  validateUnassignUser,
  validateUpdateEmployee,
} from "./employee.validation.js";

export const generateEmployeeCode = async (conn, school_id) => {
  const year = new Date().getFullYear();

  // 🔴 get last employee for this school + year
  const [[last]] = await conn.query(
    `
    SELECT employee_code 
    FROM employees
    WHERE school_id = ? 
      AND employee_code LIKE ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [school_id, `EMP-${school_id}-${year}-%`],
  );

  let nextNumber = 1;

  if (last && last.employee_code) {
    const parts = last.employee_code.split("-");
    const lastNumber = parseInt(parts[3], 10);
    nextNumber = lastNumber + 1;
  }

  const padded = String(nextNumber).padStart(4, "0");

  return `EMP-${school_id}-${year}-${padded}`;
};

const EMPLOYEE_FOLDERS = {
  photo: "employees/photo",
  aadhaar_card: "employees/aadhaar_card",
  pan_card: "employees/pan_card",
  passport_size_photo: "employees/passport_size_photo",
  degree_certificate: "employees/degree_certificate",
  experience_certificate: "employees/experience_certificate",
  signature: "employees/signature",
};

const EMPLOYEE_FILE_FIELDS = [
  "photo_url",
  "aadhaar_card_url",
  "pan_card_url",
  "passport_size_photo_url",
  "degree_certificate_url",
  "experience_certificate_url",
  "signature_url",
];

const getRequestFilePaths = (files = {}) =>
  Object.values(files).flat().map((file) => file.path).filter(Boolean);

export const createEmployee = async (req) => {
  const db = getDB();
  const conn = await db.getConnection();
  const uploadedFiles = getRequestFilePaths(req.files);

  // console.log("createEmployee req.body:", req.body);
  // console.log("createEmployee req.files:", req.files);
  try {
    let data = validateCreateEmployee(req.body);

    await conn.beginTransaction();

    /* ✅ DUPLICATE CHECK */
    const [[exists]] = await conn.query(
      `SELECT id FROM employees WHERE mobile=? OR email=?`,
      [data.mobile, data.email],
    );

    if (exists) {
      throw { status: 409, message: "Employee already exists" };
    }

    /* ✅ ADDRESS COPY */
    if (data.current_address_same_as_permanent) {
      data.permanent_address = data.current_address;
      data.permanent_area = data.current_area;
      data.permanent_city = data.current_city;
      data.permanent_district = data.current_district;
      data.permanent_state = data.current_state;
      data.permanent_postal_code = data.current_postal_code;
    }

    /* ✅ EMP CODE */
    data.employee_code = await generateEmployeeCode(conn, data.school_id);

    /* ✅ FILE HANDLING */
    if (req.files) {
      data.photo_url = getFilePath(
        req.files.photo?.[0],
        EMPLOYEE_FOLDERS.photo,
      );

      data.aadhaar_card_url = getFilePath(
        req.files.aadhaar_card?.[0],
        EMPLOYEE_FOLDERS.aadhaar_card,
      );

      data.pan_card_url = getFilePath(
        req.files.pan_card?.[0],
        EMPLOYEE_FOLDERS.pan_card,
      );

      data.passport_size_photo_url = getFilePath(
        req.files.passport_size_photo?.[0],
        EMPLOYEE_FOLDERS.passport_size_photo,
      );

      data.degree_certificate_url = getFilePath(
        req.files.degree_certificate?.[0],
        EMPLOYEE_FOLDERS.degree_certificate,
      );

      data.experience_certificate_url = getFilePath(
        req.files.experience_certificate?.[0],
        EMPLOYEE_FOLDERS.experience_certificate,
      );

      data.signature_url = getFilePath(
        req.files.signature?.[0],
        EMPLOYEE_FOLDERS.signature,
      );
    }

    const employee_id = await EmployeeModel.create(conn, data);

    await conn.commit();

    return {
      message: "Employee created successfully",
      employee_id,
      employee_code: data.employee_code,
    };
  } catch (err) {
    await conn.rollback();
    deleteUploadedFiles(uploadedFiles);
    throw err;
  } finally {
    conn.release();
  }
};

export const updateEmployee = async (id, req) => {
  const db = getDB();
  const conn = await db.getConnection();
  const uploadedFiles = getRequestFilePaths(req.files);

  try {
    if (!id) {
      throw { status: 400, message: "Employee ID is required" };
    }

    const data = validateUpdateEmployee(req.body);

    await conn.beginTransaction();

    // Existing employee
    const existing = await EmployeeModel.findById(conn, id);

    if (!existing) {
      throw { status: 404, message: "Employee not found" };
    }

    /* ============================
       FILES
    ============================ */

    const getFilePath = (file, folder) =>
      file ? `/uploads/${folder}/${file.filename}` : null;

    if (req.files?.photo) {
      data.photo_url = getFilePath(req.files.photo[0], "employees/photo");
    }

    if (req.files?.aadhaar_card) {
      data.aadhaar_card_url = getFilePath(
        req.files.aadhaar_card[0],
        "employees/aadhaar_card",
      );
    }

    if (req.files?.pan_card) {
      data.pan_card_url = getFilePath(
        req.files.pan_card[0],
        "employees/pan_card",
      );
    }

    if (req.files?.passport_size_photo) {
      data.passport_size_photo_url = getFilePath(
        req.files.passport_size_photo[0],
        "employees/passport_size_photo",
      );
    }

    if (req.files?.degree_certificate) {
      data.degree_certificate_url = getFilePath(
        req.files.degree_certificate[0],
        "employees/degree_certificate",
      );
    }

    if (req.files?.experience_certificate) {
      data.experience_certificate_url = getFilePath(
        req.files.experience_certificate[0],
        "employees/experience_certificate",
      );
    }

    if (req.files?.signature) {
      data.signature_url = getFilePath(
        req.files.signature[0],
        "employees/signature",
      );
    }

    if (!Object.keys(data).length) {
      throw { status: 400, message: "Nothing to update" };
    }

    // Track changes
    const changes = {};

    for (const [key, value] of Object.entries(data)) {
      if (existing[key] !== value) {
        changes[key] = {
          old: existing[key],
          new: value,
        };
      }
    }

    // Update
    await EmployeeModel.update(conn, id, data);

    // Updated employee
    const updated = await EmployeeModel.findById(conn, id);

    await conn.commit();

    EMPLOYEE_FILE_FIELDS.forEach((field) => {
      if (data[field] && existing[field] && existing[field] !== data[field]) {
        deleteUploadedFile(existing[field]);
      }
    });

    return {
      message: "Employee updated successfully",
      employee_id: id,
      old_data: existing,
      new_data: updated,
      changes,
    };
  } catch (err) {
    await conn.rollback();
    deleteUploadedFiles(uploadedFiles);
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteEmployee = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await EmployeeModel.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Employee not found" };
    }

    await EmployeeModel.delete(conn, id);

    await conn.commit();

    EMPLOYEE_FILE_FIELDS.forEach((field) => {
      deleteUploadedFile(existing[field]);
    });

    return { message: "Employee deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const ALLOWED_SORT_FIELDS = {
  id: "e.id",
  employee_code: "e.employee_code",
  first_name: "e.first_name",
  last_name: "e.last_name",
  name: "e.first_name",
  joining_date: "e.joining_date",
  salary: "e.salary",
  experience_years: "e.experience_years",
  department: "e.department",
  designation: "e.designation",
  status: "e.status",
  created_at: "e.created_at",
  dob: "e.dob",
};

export const buildEmployeeFilterClauses = (filters = {}) => {
  const conditions = [];
  const values = [];

  // 1. School ID (exact or comma-separated list)
  if (
    filters.school_id !== undefined &&
    filters.school_id !== null &&
    filters.school_id !== ""
  ) {
    if (Array.isArray(filters.school_id)) {
      conditions.push(
        `e.school_id IN (${filters.school_id.map(() => "?").join(",")})`,
      );
      values.push(...filters.school_id);
    } else if (String(filters.school_id).includes(",")) {
      const ids = String(filters.school_id)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      conditions.push(`e.school_id IN (${ids.map(() => "?").join(",")})`);
      values.push(...ids);
    } else {
      conditions.push("e.school_id = ?");
      values.push(filters.school_id);
    }
  }

  // 2. Global Search (q or search across multi-fields)
  const searchTerm = filters.search || filters.q;
  if (searchTerm && String(searchTerm).trim()) {
    const term = `%${String(searchTerm).trim()}%`;
    conditions.push(`(
      e.employee_code LIKE ? OR
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) LIKE ? OR
      e.email LIKE ? OR
      e.mobile LIKE ? OR
      e.aadhaar_no LIKE ? OR
      e.designation LIKE ? OR
      e.department LIKE ? OR
      e.qualification LIKE ?
    )`);
    values.push(
      term,
      term,
      term,
      term,
      term,
      term,
      term,
      term,
      term,
      term,
    );
  }

  // 3. Status (single or comma-separated e.g. "active,inactive")
  if (filters.status) {
    const statuses = String(filters.status)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length === 1) {
      conditions.push("e.status = ?");
      values.push(statuses[0]);
    } else if (statuses.length > 1) {
      conditions.push(`e.status IN (${statuses.map(() => "?").join(",")})`);
      values.push(...statuses);
    }
  }

  // 4. Designation (single or comma-separated)
  if (filters.designation) {
    const designations = String(filters.designation)
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean);
    if (designations.length === 1) {
      conditions.push("e.designation = ?");
      values.push(designations[0]);
    } else if (designations.length > 1) {
      conditions.push(
        `e.designation IN (${designations.map(() => "?").join(",")})`,
      );
      values.push(...designations);
    }
  }

  // 5. Department (single or comma-separated)
  if (filters.department) {
    const departments = String(filters.department)
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean);
    if (departments.length === 1) {
      conditions.push("e.department = ?");
      values.push(departments[0]);
    } else if (departments.length > 1) {
      conditions.push(
        `e.department IN (${departments.map(() => "?").join(",")})`,
      );
      values.push(...departments);
    }
  }

  // 6. Gender
  if (filters.gender) {
    conditions.push("e.gender = ?");
    values.push(String(filters.gender).trim().toLowerCase());
  }

  // 7. Blood group
  if (filters.blood_group) {
    conditions.push("e.blood_group = ?");
    values.push(String(filters.blood_group).trim().toUpperCase());
  }

  // 8. User Assignment status (true/false/1/0)
  const userAssigned =
    filters.user_assigned ?? filters.is_assigned ?? filters.has_user;
  if (
    userAssigned !== undefined &&
    userAssigned !== null &&
    userAssigned !== ""
  ) {
    const val = String(userAssigned).toLowerCase();
    if (val === "true" || val === "1" || val === "yes") {
      conditions.push("e.user_id IS NOT NULL");
    } else if (val === "false" || val === "0" || val === "no") {
      conditions.push("e.user_id IS NULL");
    }
  }

  // 9. Specific user_id
  if (filters.user_id) {
    conditions.push("e.user_id = ?");
    values.push(filters.user_id);
  }

  // 10. Qualification
  if (filters.qualification) {
    conditions.push("e.qualification LIKE ?");
    values.push(`%${String(filters.qualification).trim()}%`);
  }

  // 11. Experience range
  const minExp =
    filters.min_experience ?? filters.experience_min ?? filters.min_exp;
  if (minExp !== undefined && minExp !== null && minExp !== "") {
    conditions.push("e.experience_years >= ?");
    values.push(Number(minExp));
  }

  const maxExp =
    filters.max_experience ?? filters.experience_max ?? filters.max_exp;
  if (maxExp !== undefined && maxExp !== null && maxExp !== "") {
    conditions.push("e.experience_years <= ?");
    values.push(Number(maxExp));
  }

  if (
    filters.experience_years !== undefined &&
    filters.experience_years !== null &&
    filters.experience_years !== ""
  ) {
    conditions.push("e.experience_years = ?");
    values.push(Number(filters.experience_years));
  }

  // 12. Salary range
  const minSalary = filters.min_salary ?? filters.salary_min;
  if (minSalary !== undefined && minSalary !== null && minSalary !== "") {
    conditions.push("e.salary >= ?");
    values.push(Number(minSalary));
  }

  const maxSalary = filters.max_salary ?? filters.salary_max;
  if (maxSalary !== undefined && maxSalary !== null && maxSalary !== "") {
    conditions.push("e.salary <= ?");
    values.push(Number(maxSalary));
  }

  // 13. Joining Date filters
  const joiningDateFrom =
    filters.joining_date_from ?? filters.from_joining_date ?? filters.from_date;
  if (joiningDateFrom) {
    conditions.push("e.joining_date >= ?");
    values.push(joiningDateFrom);
  }

  const joiningDateTo =
    filters.joining_date_to ?? filters.to_joining_date ?? filters.to_date;
  if (joiningDateTo) {
    conditions.push("e.joining_date <= ?");
    values.push(joiningDateTo);
  }

  if (filters.joining_date) {
    conditions.push("e.joining_date = ?");
    values.push(filters.joining_date);
  }

  if (filters.joining_year) {
    conditions.push("YEAR(e.joining_date) = ?");
    values.push(Number(filters.joining_year));
  }

  if (filters.joining_month) {
    conditions.push("MONTH(e.joining_date) = ?");
    values.push(Number(filters.joining_month));
  }

  // 14. Date of Birth filters
  const dobFrom = filters.dob_from ?? filters.from_dob;
  if (dobFrom) {
    conditions.push("e.dob >= ?");
    values.push(dobFrom);
  }

  const dobTo = filters.dob_to ?? filters.to_dob;
  if (dobTo) {
    conditions.push("e.dob <= ?");
    values.push(dobTo);
  }

  // 15. Address / Location filters
  if (filters.city) {
    conditions.push("(e.current_city LIKE ? OR e.permanent_city LIKE ?)");
    values.push(`%${filters.city}%`, `%${filters.city}%`);
  }

  if (filters.district) {
    conditions.push(
      "(e.current_district LIKE ? OR e.permanent_district LIKE ?)",
    );
    values.push(`%${filters.district}%`, `%${filters.district}%`);
  }

  if (filters.state) {
    conditions.push("(e.current_state LIKE ? OR e.permanent_state LIKE ?)");
    values.push(`%${filters.state}%`, `%${filters.state}%`);
  }

  if (filters.postal_code) {
    conditions.push(
      "(e.current_postal_code = ? OR e.permanent_postal_code = ?)",
    );
    values.push(filters.postal_code, filters.postal_code);
  }

  // 16. Employee Code
  if (filters.employee_code) {
    conditions.push("e.employee_code LIKE ?");
    values.push(`%${filters.employee_code}%`);
  }

  // 17. Mobile / Email exact or partial
  if (filters.mobile) {
    conditions.push("e.mobile LIKE ?");
    values.push(`%${filters.mobile}%`);
  }

  if (filters.email) {
    conditions.push("e.email LIKE ?");
    values.push(`%${filters.email}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, values };
};

export const getEmployee = async (id) => {
  const db = getDB();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const employee = await EmployeeModel.findById(db, id);
    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    // Attach documents
    const documents = await EmployeeDocumentModel.findByEmployeeId(db, id);
    employee.documents = documents || [];

    return employee;
  } catch (err) {
    throw err;
  }
};

export const buildFilterDisplay = (filters = {}) => {
  const display = {};

  if (filters.search || filters.q) {
    display.search = String(filters.search || filters.q).trim();
  }
  if (filters.school_id) {
    display.school_id = filters.school_id;
  }
  if (filters.status) {
    display.status = filters.status;
  }
  if (filters.designation) {
    display.designation = filters.designation;
  }
  if (filters.department) {
    display.department = filters.department;
  }
  if (filters.gender) {
    display.gender = filters.gender;
  }
  if (filters.blood_group) {
    display.blood_group = filters.blood_group;
  }
  const userAssigned =
    filters.user_assigned ?? filters.is_assigned ?? filters.has_user;
  if (
    userAssigned !== undefined &&
    userAssigned !== null &&
    userAssigned !== ""
  ) {
    display.user_assigned =
      String(userAssigned) === "true" || String(userAssigned) === "1";
  }
  if (
    filters.min_experience !== undefined ||
    filters.max_experience !== undefined
  ) {
    display.experience_range = `${filters.min_experience ?? 0} - ${filters.max_experience ?? "Any"} yrs`;
  }
  if (filters.min_salary !== undefined || filters.max_salary !== undefined) {
    display.salary_range = `${filters.min_salary ?? 0} - ${filters.max_salary ?? "Any"}`;
  }
  if (filters.joining_date_from || filters.joining_date_to) {
    display.joining_date_range = `${filters.joining_date_from ?? "Start"} to ${filters.joining_date_to ?? "Present"}`;
  }
  if (filters.joining_year) {
    display.joining_year = filters.joining_year;
  }
  if (filters.joining_month) {
    display.joining_month = filters.joining_month;
  }
  if (filters.dob_from || filters.dob_to) {
    display.dob_range = `${filters.dob_from ?? "Start"} to ${filters.dob_to ?? "End"}`;
  }
  if (filters.city) {
    display.city = filters.city;
  }
  if (filters.district) {
    display.district = filters.district;
  }
  if (filters.state) {
    display.state = filters.state;
  }
  if (filters.postal_code) {
    display.postal_code = filters.postal_code;
  }
  if (filters.qualification) {
    display.qualification = filters.qualification;
  }
  if (filters.sort_by || filters.sortBy) {
    display.sorted_by = `${filters.sort_by || filters.sortBy} (${String(filters.sort_order || filters.sortOrder || "DESC").toUpperCase()})`;
  }

  return display;
};

export const getEmployees = async (filters = {}) => {
  const db = getDB();

  try {
    const { whereClause, values } = buildEmployeeFilterClauses(filters);
    const total = await EmployeeModel.countWithFilters(db, {
      whereClause,
      values: [...values],
    });

    // Sorting
    const sortBy = String(
      filters.sort_by || filters.sortBy || "id",
    ).toLowerCase();
    const sortOrder = String(
      filters.sort_order || filters.sortOrder || filters.order || "DESC",
    ).toUpperCase();
    const validOrder = sortOrder === "ASC" ? "ASC" : "DESC";

    let orderClause = "ORDER BY e.id DESC";
    if (sortBy === "name") {
      orderClause = `ORDER BY e.first_name ${validOrder}, e.last_name ${validOrder}`;
    } else if (ALLOWED_SORT_FIELDS[sortBy]) {
      orderClause = `ORDER BY ${ALLOWED_SORT_FIELDS[sortBy]} ${validOrder}`;
    }

    // Pagination
    const isAll =
      filters.all === "true" ||
      filters.all === true ||
      filters.limit === "all" ||
      Number(filters.limit) === -1;

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = isAll
      ? null
      : Math.max(1, Math.min(Number(filters.limit) || 20, 500));
    const offset = isAll
      ? 0
      : filters.offset !== undefined
        ? Math.max(0, Number(filters.offset))
        : (page - 1) * limit;

    let limitClause = "";
    const queryValues = [...values];
    if (!isAll && limit !== null) {
      limitClause = "LIMIT ? OFFSET ?";
      queryValues.push(limit, offset);
    }

    const rows = await EmployeeModel.findWithFilters(db, {
      whereClause,
      values: queryValues,
      orderClause,
      limitClause,
    });

    const totalPages = isAll ? 1 : Math.ceil(total / (limit || 1));
    const from = total === 0 ? 0 : offset + 1;
    const to = total === 0 ? 0 : Math.min(offset + rows.length, total);
    const count = rows.length;

    const filterDisplay = buildFilterDisplay(filters);

    return {
      rows,
      pagination: {
        total,
        page: isAll ? 1 : page,
        limit: isAll ? total : limit,
        total_pages: totalPages === 0 ? 1 : totalPages,
        totalPages: totalPages === 0 ? 1 : totalPages,
        from,
        to,
        count,
        has_next: isAll ? false : page < totalPages,
        hasNextPage: isAll ? false : page < totalPages,
        has_prev: isAll ? false : page > 1,
        hasPrevPage: isAll ? false : page > 1,
      },
      filter_display: filterDisplay,
      filters,
    };
  } catch (err) {
    throw err;
  }
};

export const getEmployeesByToken = async (user, filters = {}) => {
  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  const db = getDB();

  // Fresh user check with role & school resolution
  const [[dbUser]] = await db.query(
    `
    SELECT 
      u.id,
      u.school_id,
      GROUP_CONCAT(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = ?
    GROUP BY u.id
    `,
    [user.id],
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const roles = dbUser.roles ? dbUser.roles.split(",").filter(Boolean) : [];
  const isAdmin =
    roles.includes("ADMIN") ||
    user.roles?.includes("ADMIN") ||
    user.role === "admin";

  const scopedFilters = { ...filters };

  // Non-admins are locked to their own school
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    scopedFilters.school_id = dbUser.school_id;
  }

  return await getEmployees(scopedFilters);
};

export const getEmployeeFilterOptions = async (
  user = null,
  schoolId = null,
) => {
  const db = getDB();
  let targetSchoolId = schoolId;

  if (user) {
    const roles = user.roles || (user.role ? [user.role] : []);
    const isAdmin = roles.includes("ADMIN") || roles.includes("admin");
    if (!isAdmin && user.school_id) {
      targetSchoolId = user.school_id;
    }
  }

  return await EmployeeModel.getFilterOptions(db, targetSchoolId);
};

export const getEmployeeStats = async (user = null, schoolId = null) => {
  const db = getDB();
  let targetSchoolId = schoolId;

  if (user) {
    const roles = user.roles || (user.role ? [user.role] : []);
    const isAdmin = roles.includes("ADMIN") || roles.includes("admin");
    if (!isAdmin && user.school_id) {
      targetSchoolId = user.school_id;
    }
  }

  return await EmployeeModel.getStats(db, targetSchoolId);
};

export const assignUserToEmployee = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { employee_id, user_id } = validateAssignUser(data);

    await conn.beginTransaction();

    // 🔴 1. Check employee
    const employee = await EmployeeModel.findById(conn, employee_id);
    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    // 🔴 2. Check user
    const user = await UserModel.findById(conn, user_id);
    console.log(user);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    // 🔴 3. School mismatch
    if (employee.school_id !== user.school_id) {
      throw {
        status: 400,
        message: "User and employee must belong to same school",
      };
    }

    // 🔴 4. Employee already linked
    if (employee.user_id) {
      throw {
        status: 409,
        message: "Employee already assigned to a user",
      };
    }

    // 🔴 5. User already linked
    const existing = await EmployeeModel.findByUserId(conn, user_id);
    if (existing) {
      throw {
        status: 409,
        message: "User already assigned to another employee",
      };
    }

    // 🔥 6. Assign
    await EmployeeModel.assignUser(conn, employee_id, user_id);

    await conn.commit();

    return {
      message: "User assigned to employee successfully",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const unassignUserFromEmployee = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { employee_id } = validateUnassignUser(data);

    await conn.beginTransaction();

    const employee = await EmployeeModel.findById(conn, employee_id);

    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    if (!employee.user_id) {
      throw {
        status: 400,
        message: "Employee is not assigned to any user",
      };
    }

    await EmployeeModel.unassignUser(conn, employee_id);

    await conn.commit();

    return { message: "User unassigned successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
