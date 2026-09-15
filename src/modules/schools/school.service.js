
import { getDB } from "../../config/db.js";
import { SchoolModel } from "./school.model.js";
import {
  validateCreateSchool,
  validateUpdateSchool,
} from "./school.validation.js";
import {
  deleteSchoolFile,
  formatSchoolWithLogoUrls,
  getFullFileUrl,
} from "../../middlewares/school.upload.js";

const deleteFileSafe = deleteSchoolFile;
const SCHOOL_STATUSES = ["all", "active", "inactive"];

const getStatusFilter = (req) => {
  const status = req?.query?.status || "all";

  if (!SCHOOL_STATUSES.includes(status)) {
    throw { status: 400, message: "Invalid status filter" };
  }

  return status;
};

export const generateSchoolCode = async (connection) => {
  const [[last]] = await connection.query(
    `SELECT id FROM schools ORDER BY id DESC LIMIT 1`,
  );

  const nextId = (last?.id || 0) + 1;

  return `SCH-${String(nextId).padStart(4, "0")}`;
};



// export const createSchool = async (data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     const validated = validateCreateSchool(data);

//     // 🔴 duplicate code check
//     const exists = await SchoolModel.findByCode(validated.code);
//     if (exists) {
//       throw { status: 409, message: "School code already exists" };
//     }

//     await connection.beginTransaction();

//     const schoolId = await SchoolModel.create(connection, validated);

//     await connection.commit();

//     return {
//       message: "School created",
//       id: schoolId
//     };

//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

/* ------------- code automatically generated -------------------------------*/
// export const createSchool = async (data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     const validated = validateCreateSchool(data);

//     await connection.beginTransaction();

//     // 🔥 GENERATE CODE HERE
//     const code = await generateSchoolCode(connection);

//     // 🔴 SAFETY CHECK (rare but needed)
//     const [exists] = await connection.query(
//       `SELECT id FROM schools WHERE code=?`,
//       [code]
//     );

//     if (exists.length) {
//       throw { status: 409, message: "Code generation conflict" };
//     }

//     const schoolId = await SchoolModel.create(connection, {
//       ...validated,
//       code
//     });

//     await connection.commit();

//     return {
//       message: "School created",
//       id: schoolId,
//       code
//     };

//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

export const createSchool = async (data, req = null) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateCreateSchool(data);

    await connection.beginTransaction();

    const code = await generateSchoolCode(connection);

    const [exists] = await connection.query(
      `SELECT id FROM schools WHERE code=?`,
      [code],
    );

    if (exists.length) {
      throw { status: 409, message: "Code generation conflict" };
    }

    const schoolId = await SchoolModel.create(connection, {
      ...validated,
      code,
      logo_url: data.logo_url || null,
    });

    await connection.commit();

    return {
      message: "School created",
      id: schoolId,
      code,
      logo_url: data.logo_url || null,
      full_logo_url: getFullFileUrl(data.logo_url, req),
      logo_full_url: getFullFileUrl(data.logo_url, req),
    };
  } catch (err) {
    await connection.rollback();

    // 🔥 cleanup uploaded file if exists
    if (data.logo_url) {
      deleteFileSafe(data.logo_url);
    }

    throw err;
  } finally {
    connection.release();
  }
};

export const getAllSchools = async (req = null) => {
  const rows = await SchoolModel.getAll(getStatusFilter(req));
  return rows.map((s) => formatSchoolWithLogoUrls(s, req));
};

export const getAllSchoolsByToken = async (user, req = null) => {
  const db = getDB();
  const status = getStatusFilter(req);

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // 🔥 Fetch fresh user + roles from DB
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

  const conditions = [];
  const values = [];

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    conditions.push("id = ?");
    values.push(dbUser.school_id);
  }

  if (status !== "all") {
    conditions.push("status = ?");
    values.push(status);
  }

  const query = `
    SELECT *
    FROM schools
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY id DESC
  `;

  const [rows] = await db.query(query, values);

  return rows.map((s) => formatSchoolWithLogoUrls(s, req));
};

export const getSchoolById = async (id, req = null) => {
  const school = await SchoolModel.findById(id);

  if (!school) {
    throw { status: 404, message: "School not found" };
  }

  return formatSchoolWithLogoUrls(school, req);
};

// export const updateSchool = async (id, data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     const updates = validateUpdateSchool(data);

//     const school = await SchoolModel.findById(id);
//     if (!school) {
//       throw { status: 404, message: "School not found" };
//     }

//     const fields = [];
//     const values = [];

//     Object.keys(updates).forEach((key) => {
//       fields.push(`${key}=?`);
//       values.push(updates[key]);
//     });

//     if (fields.length) {
//       await connection.beginTransaction();

//       await SchoolModel.update(connection, id, fields, values);

//       await connection.commit();
//     }

//     return { message: "School updated" };
//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

export const updateSchool = async (id, data, req = null) => {
  const db = getDB();
  const connection = await db.getConnection();

  let newLogo = data.logo_url || null;
  const isRemovingLogo =
    data.remove_logo === true ||
    data.remove_logo === "true" ||
    (data.logo_url === null && "logo_url" in data);

  try {
    if (isRemovingLogo) {
      data.logo_url = null;
    }

    const updates = validateUpdateSchool(data);

    const school = await SchoolModel.findById(id);
    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(updates[key]);
    });

    if (!fields.length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await connection.beginTransaction();

    await SchoolModel.update(connection, id, fields, values);

    await connection.commit();

    // 🔥 Permanently delete old logo AFTER successful update if new logo uploaded or logo removed
    if (
      (newLogo || isRemovingLogo) &&
      school.logo_url &&
      school.logo_url !== newLogo
    ) {
      deleteSchoolFile(school.logo_url);
    }

    const updatedLogo = newLogo || (isRemovingLogo ? null : (updates.logo_url !== undefined ? updates.logo_url : school.logo_url));
    const fullLogo = getFullFileUrl(updatedLogo, req);

    return {
      message: "School updated",
      logo_url: updatedLogo,
      full_logo_url: fullLogo,
      logo_full_url: fullLogo,
    };

  } catch (err) {
    await connection.rollback();

    // 🔥 Permanently cleanup newly uploaded logo if transaction failed
    if (newLogo) {
      deleteSchoolFile(newLogo);
    }

    throw err;
  } finally {
    connection.release();
  }
};

export const deleteSchool = async (id) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const school = await SchoolModel.findById(id);
    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    await connection.beginTransaction();

    await SchoolModel.delete(connection, id);

    await connection.commit();

    // 🔥 Permanently delete school logo from storage when school is deleted
    if (school.logo_url) {
      deleteSchoolFile(school.logo_url);
    }

    return { message: "School deleted" };
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451 || (err.message && err.message.includes("foreign key constraint fails"))) {
      throw {
        status: 400,
        message: "Cannot delete this school because it is currently linked to existing records (such as employee attendance, students, or staff). Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    connection.release();
  }
};
