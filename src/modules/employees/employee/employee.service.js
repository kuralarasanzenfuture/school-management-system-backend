import { getDB } from "../../../config/db.js";
import getFilePath from "../../../utils/getFilePath.js";
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

export const createEmployee = async (req) => {
  const db = getDB();
  const conn = await db.getConnection();

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
    throw err;
  } finally {
    conn.release();
  }
};

export const updateEmployee = async (id, req) => {
  const db = getDB();
  const conn = await db.getConnection();

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

    return {
      message: "Employee updated successfully",
      employee_id: id,
      old_data: existing,
      new_data: updated,
      changes,
    };
  } catch (err) {
    await conn.rollback();
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

    return { message: "Employee deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getEmployee = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const employee = await EmployeeModel.findById(db, id);
    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    return employee;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
};

export const getEmployees = async () => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const employees = await EmployeeModel.findAll(conn);
    return employees;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
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
