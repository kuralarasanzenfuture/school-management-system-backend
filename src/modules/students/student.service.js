import { getDB } from "../../config/db.js";
import getFilePath from "../../utils/getFilePath.js";
import { StudentModel } from "./student.model.js";
import {
  validateCreateStudent,
  validateUpdateStudent,
} from "./student.validation.js";
import fs from "fs";

const FILE_FOLDERS = {
  photo: "students/photos",
  aadhaar_front: "students/aadhaar",
  aadhaar_back: "students/aadhaar",
  birth_certificate: "students/certificates",
};

/* =========================================
   🔥 Generate Admission Number
========================================= */
const generateStudentCode = async (conn) => {
  const year = new Date().getFullYear();

  const [[last]] = await conn.query(
    `
    SELECT student_code
    FROM students
    WHERE student_code LIKE ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [`STD-${year}-%`],
  );

  let next = 1;

  if (last?.student_code) {
    next = parseInt(last.student_code.split("-").pop(), 10) + 1;
  }

  return `STD-${year}-${String(next).padStart(4, "0")}`;
};

/* =========================================
   🔥 CREATE STUDENT
========================================= */
// export const createStudent = async (req) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     if (!req.body || Object.keys(req.body).length === 0) {
//       throw { status: 400, message: "Request body is empty" };
//     }
//     let data = validateCreateStudent(req.body);

//     // console.log("VALIDATION INPUT:", data);

//     await conn.beginTransaction();

//     // school exists
//     const [[school]] = await conn.query(
//       `SELECT id FROM schools WHERE id=? AND status='active'`,
//       [data.school_id],
//     );

//     if (!school) {
//       throw { status: 404, message: "School not found or inactive" };
//     }

//     // 🔴 DUPLICATE CHECKS
//     const [[mobileExists]] = await conn.query(
//       `SELECT id FROM students WHERE mobile_no=?`,
//       [data.mobile_no],
//     );

//     // if (mobileExists) {
//     //   throw { status: 409, message: "Mobile already exists" };
//     // }

//     if (data.aadhaar_no) {
//       const [[aadhaarExists]] = await conn.query(
//         `SELECT id FROM students WHERE aadhaar_no=?`,
//         [data.aadhaar_no],
//       );

//       if (aadhaarExists) {
//         throw { status: 409, message: "Aadhaar already exists" };
//       }
//     }

//     // 🔥 AUTO GENERATE ADMISSION NUMBER
//     data.student_code = await generateStudentCode(conn, data.school_id);

//     // 🔥 FILE HANDLING
//     // if (req.files) {
//     //   data.photo_url = req.files.photo?.[0]?.path || null;
//     //   data.aadhaar_front_url = req.files.aadhaar_front?.[0]?.path || null;
//     //   data.aadhaar_back_url = req.files.aadhaar_back?.[0]?.path || null;
//     //   data.birth_certificate_url =
//     //     req.files.birth_certificate?.[0]?.path || null;
//     //   data.transfer_certificate_url =
//     //     req.files.transfer_certificate?.[0]?.path || null;
//     //   data.previous_marksheets_url = req.files.marksheets?.[0]?.path || null;
//     // }
//     if (req.files) {
//       data.photo_url = getFilePath(req.files.photo?.[0], "students/photos");
//       data.aadhaar_front_url = getFilePath(
//         req.files.aadhaar_front?.[0],
//         // "students/aadhaar",
//         FILE_FOLDERS.aadhaar_front,
//       );

//       data.aadhaar_back_url = getFilePath(
//         req.files.aadhaar_back?.[0],
//         "students/aadhaar",
//       );
//       data.birth_certificate_url = getFilePath(
//         req.files.birth_certificate?.[0],
//         "students/certificates",
//       );

//       data.transfer_certificate_url = getFilePath(
//         req.files.transfer_certificate?.[0],
//         "students/certificates",
//       );
//       data.previous_marksheets_url = getFilePath(
//         req.files.previous_marksheets?.[0],
//         "students/marksheets",
//       );
//     }

//     // 🔥 ADDRESS COPY
//     if (data.current_address_same_as_permanent) {
//       data.permanent_address = data.current_address;
//       data.permanent_city = data.current_city;
//       data.permanent_state = data.current_state;
//       data.permanent_district = data.current_district;
//       data.permanent_postal_code = data.current_postal_code;
//       data.permanent_area = data.current_area;
//     }

//     // console.log("student create DATA:", data);

//     const id = await StudentModel.create(conn, data);

//     await conn.commit();

//     return {
//       message: "Student created successfully",
//       id,
//       admission_no: data.admission_no,
//     };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

// export const createStudent = async (req) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   const uploadedFiles = [];

//   try {
//     let data = { ...req.body };

//     if (!data || Object.keys(data).length === 0) {
//       throw { status: 400, message: "Request body is empty" };
//     }

//     // normalize
//     data.school_id = Number(data.school_id);

//     data.current_address_same_as_permanent =
//       data.current_address_same_as_permanent === "true";

//     // validate AFTER normalization
//     data = validateCreateStudent(data);

//     // console.log("VALIDATION INPUT:", data);

//     await conn.beginTransaction();

//     const [[school]] = await conn.query(
//       `SELECT id FROM schools WHERE id=? AND status='active'`,
//       [data.school_id],
//     );

//     if (!school) {
//       throw { status: 404, message: "School not found or inactive" };
//     }

//     // duplicate check (WITH school_id)
//     const [[mobileExists]] = await conn.query(
//       `SELECT id FROM students WHERE mobile_no=? AND school_id=?`,
//       [data.mobile_no, data.school_id],
//     );

//     // if (mobileExists) {
//     //   throw { status: 409, message: "Mobile already exists" };
//     // }

//     if (data.aadhaar_no) {
//       const [[aadhaarExists]] = await conn.query(
//         `SELECT id FROM students WHERE aadhaar_no=? AND school_id=?`,
//         [data.aadhaar_no, data.school_id],
//       );

//       if (aadhaarExists) {
//         throw { status: 409, message: "Aadhaar already exists" };
//       }
//     }

//     data.admission_no = await generateAdmissionNo(conn, data.school_id);

//     // files
//     const uploadedFiles = [];

//     const getFilePath = (file, folder) => {
//       if (!file) return null;
//       return `/uploads/${folder}/${file.filename}`;
//     };

//     if (req.files) {
//       // 🔴 collect all files (for rollback cleanup)
//       Object.values(req.files).forEach((arr) => {
//         arr.forEach((f) => uploadedFiles.push(f.path));
//       });

//       // =========================
//       // ✅ SINGLE FILES
//       // =========================
//       data.photo_url = getFilePath(req.files.photo?.[0], "students/photos");

//       data.aadhaar_front_url = getFilePath(
//         req.files.aadhaar_front?.[0],
//         "students/aadhaar",
//       );

//       data.aadhaar_back_url = getFilePath(
//         req.files.aadhaar_back?.[0],
//         "students/aadhaar",
//       );

//       data.birth_certificate_url = getFilePath(
//         req.files.birth_certificate?.[0],
//         "students/certificates",
//       );

//       data.transfer_certificate_url = getFilePath(
//         req.files.transfer_certificate?.[0],
//         "students/certificates",
//       );

//       // =========================
//       // ✅ MULTIPLE FILES
//       // =========================
//       data.previous_marksheets_url = req.files.previous_marksheets
//         ? JSON.stringify(
//             req.files.previous_marksheets.map(
//               (f) => `/uploads/students/marksheets/${f.filename}`,
//             ),
//           )
//         : null;
//     }

//     // address copy
//     if (data.current_address_same_as_permanent) {
//       data.permanent_address = data.current_address;
//       data.permanent_area = data.current_area;
//       data.permanent_city = data.current_city;
//       data.permanent_state = data.current_state;
//       data.permanent_district = data.current_district;
//       data.permanent_postal_code = data.current_postal_code;
//     }

//     const id = await StudentModel.create(conn, data);

//     await conn.commit();

//     return {
//       message: "Student created successfully",
//       data: {
//         id,
//         admission_no: data.admission_no,
//       },
//     };
//   } catch (err) {
//     await conn.rollback();

//     // 🔥 cleanup files
//     uploadedFiles.forEach((p) => fs.unlink(p, () => {}));

//     throw err;
//   } finally {
//     conn.release();
//   }
// };

export const createStudent = async (req) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw { status: 400, message: "Request body is empty" };
    }

    const data = validateCreateStudent(req.body);

    await conn.beginTransaction();

    // Check school
    const [[school]] = await conn.query(
      `SELECT id FROM schools WHERE id = ? AND status = 'active'`,
      [data.school_id],
    );

    if (!school) {
      throw { status: 404, message: "School not found or inactive" };
    }

    // Mobile duplicate
    const [[mobileExists]] = await conn.query(
      `SELECT id FROM students WHERE mobile_no = ?`,
      [data.mobile_no],
    );

    if (mobileExists) {
      throw { status: 409, message: "Mobile number already exists" };
    }

    // Aadhaar duplicate
    if (data.aadhaar_no) {
      const [[aadhaarExists]] = await conn.query(
        `SELECT id FROM students WHERE aadhaar_no = ?`,
        [data.aadhaar_no],
      );

      if (aadhaarExists) {
        throw { status: 409, message: "Aadhaar number already exists" };
      }
    }

    // Generate Student Code
    // data.student_code = await generateStudentCode(conn, data.school_id);
    data.student_code = await generateStudentCode(conn);

    // Uploads
    if (req.files) {
      data.photo_url = getFilePath(req.files.photo?.[0], FILE_FOLDERS.photo);

      data.aadhaar_front_url = getFilePath(
        req.files.aadhaar_front?.[0],
        FILE_FOLDERS.aadhaar_front,
      );

      data.aadhaar_back_url = getFilePath(
        req.files.aadhaar_back?.[0],
        FILE_FOLDERS.aadhaar_back,
      );

      data.birth_certificate_url = getFilePath(
        req.files.birth_certificate?.[0],
        FILE_FOLDERS.birth_certificate,
      );

      data.transfer_certificate_url = getFilePath(
        req.files.transfer_certificate?.[0],
        "students/certificates",
      );

      data.previous_marksheets_url = getFilePath(
        req.files.previous_marksheets?.[0],
        "students/marksheets",
      );
    }

    // Copy Address
    if (data.current_address_same_as_permanent) {
      data.permanent_address = data.current_address;
      data.permanent_city = data.current_city;
      data.permanent_state = data.current_state;
      data.permanent_district = data.current_district;
      data.permanent_postal_code = data.current_postal_code;
      data.permanent_area = data.current_area;
    }

    console.log("Student Data:", data);

    const id = await StudentModel.create(conn, data);

    await conn.commit();

    return {
      success: true,
      message: "Student created successfully",
      id,
      student_code: data.student_code,
    };
  } catch (err) {
    await conn.rollback();

    console.error("CREATE STUDENT ERROR:", err);

    throw {
      status: err.status || 500,
      message: err.message || "Failed to create student",
    };
  } finally {
    conn.release();
  }
};

/* =========================================
   🔥 GET ALL STUDENTS
========================================= */
export const getAllStudents = async () => {
  return await StudentModel.getAll();
};

export const getAllStudentsByToken = async (user) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 Get fresh user + roles from DB
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

  // 🔥 Normalize roles
  const roles = dbUser.roles ? dbUser.roles.split(",").filter(Boolean) : [];

  const isAdmin = roles.includes("ADMIN");

  let query = `
    SELECT *
    FROM students
  `;

  const values = [];

  // 🔥 NON-ADMIN → restrict by school
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    query += ` WHERE school_id = ?`;
    values.push(dbUser.school_id);
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

/* =========================================
   🔥 GET BY ID
========================================= */
export const getStudentById = async (id) => {
  if (!id) throw { status: 400, message: "ID required" };

  const student = await StudentModel.findById(id);

  if (!student) {
    throw { status: 404, message: "Student not found" };
  }

  return student;
};

/* =========================================
   🔥 UPDATE STUDENT
========================================= */
export const updateStudent = async (id, req) => {
  const db = getDB();
  const conn = await db.getConnection();

  const uploadedFiles = [];

  try {
    if (!id) throw { status: 400, message: "ID required" };

    let data = { ...req.body };

    // if (!data || (Object.keys(data).length === 0 && !req.files)) {
    //   throw { status: 400, message: "Nothing to update" };
    // }

    // 🔴 NORMALIZE
    if (data.school_id) data.school_id = Number(data.school_id);

    if (data.current_address_same_as_permanent !== undefined) {
      data.current_address_same_as_permanent =
        data.current_address_same_as_permanent === "true" ||
        data.current_address_same_as_permanent === true;
    }

    // 🔴 VALIDATE (use update validator, not create)
    data = validateUpdateStudent(data);

    await conn.beginTransaction();

    const existing = await StudentModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Student not found" };
    }

    // 🔴 DUPLICATE CHECK (mobile)
    if (data.mobile_no) {
      const [[mobileExists]] = await conn.query(
        `SELECT id FROM students WHERE mobile_no=? AND id!=? AND school_id=?`,
        [data.mobile_no, id, existing.school_id],
      );

      //   if (mobileExists) {
      //     throw { status: 409, message: "Mobile already exists" };
      //   }
    }

    // 🔴 DUPLICATE CHECK (aadhaar)
    if (data.aadhaar_no) {
      const [[aadhaarExists]] = await conn.query(
        `SELECT id FROM students WHERE aadhaar_no=? AND id!=? AND school_id=?`,
        [data.aadhaar_no, id, existing.school_id],
      );

      if (aadhaarExists) {
        throw { status: 409, message: "Aadhaar already exists" };
      }
    }

    // =========================
    // 🔥 FILE HANDLING (CORRECT)
    // =========================

    const getFilePath = (file, folder) => {
      if (!file) return null;
      return `/uploads/${folder}/${file.filename}`;
    };

    if (req.files) {
      // collect for rollback
      Object.values(req.files).forEach((arr) =>
        arr.forEach((f) => uploadedFiles.push(f.path)),
      );

      if (req.files.photo) {
        data.photo_url = getFilePath(req.files.photo[0], "students/photos");
      }

      if (req.files.aadhaar_front) {
        data.aadhaar_front_url = getFilePath(
          req.files.aadhaar_front[0],
          "students/aadhaar",
        );
      }

      if (req.files.aadhaar_back) {
        data.aadhaar_back_url = getFilePath(
          req.files.aadhaar_back[0],
          "students/aadhaar",
        );
      }

      if (req.files.birth_certificate) {
        data.birth_certificate_url = getFilePath(
          req.files.birth_certificate[0],
          "students/certificates",
        );
      }
      if (req.files.transfer_certificate) {
        data.transfer_certificate_url = getFilePath(
          req.files.transfer_certificate[0],
          "students/certificates",
        );
      }

      if (req.files.previous_marksheets) {
        data.previous_marksheets_url = JSON.stringify(
          req.files.previous_marksheets.map(
            (f) => `/uploads/students/marksheets/${f.filename}`,
          ),
        );
      }
    }

    // =========================
    // 🔥 ADDRESS COPY LOGIC
    // =========================
    if (data.current_address_same_as_permanent) {
      data.permanent_address = data.current_address ?? existing.current_address;
      data.permanent_area = data.current_area ?? existing.current_area;
      data.permanent_city = data.current_city ?? existing.current_city;
      data.permanent_state = data.current_state ?? existing.current_state;
      data.permanent_district =
        data.current_district ?? existing.current_district;
      data.permanent_postal_code =
        data.current_postal_code ?? existing.current_postal_code;
    }

    // 🔴 REMOVE undefined fields (important)
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) delete data[key];
    });

    // console.log("updated student DATA:", data);

    await StudentModel.update(conn, id, data);

    await conn.commit();

    return {
      message: "Student updated successfully",
    };
  } catch (err) {
    await conn.rollback();

    // 🔥 rollback file cleanup
    uploadedFiles.forEach((p) => fs.unlink(p, () => {}));

    throw err;
  } finally {
    conn.release();
  }
};

/* =========================================
   🔥 DELETE STUDENT
========================================= */
export const deleteStudent = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    await conn.beginTransaction();

    const existing = await StudentModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Student not found" };
    }

    await StudentModel.delete(conn, id);

    await conn.commit();

    return { message: "Student deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
