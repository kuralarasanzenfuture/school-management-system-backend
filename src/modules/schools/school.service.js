import { getDB } from "../../config/db.js";
import { SchoolModel } from "./school.model.js";
import {
  validateCreateSchool,
  validateUpdateSchool,
} from "./school.validation.js";
import fs from "fs";

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

export const createSchool = async (data) => {
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
    };
  } catch (err) {
    await connection.rollback();

    // 🔥 cleanup uploaded file if exists
    if (data.logo_url) {
      fs.unlink(`.${data.logo_url}`, () => {});
    }

    throw err;
  } finally {
    connection.release();
  }
};

export const getAllSchools = async () => {
  return await SchoolModel.getAll();
};

export const getAllSchoolsByToken = async (user) => {
  const db = getDB();

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

  let query = `
    SELECT *
    FROM schools
  `;

  const values = [];

  // 🔥 NON-ADMIN → only their school
  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    query += ` WHERE id = ?`;
    values.push(dbUser.school_id);
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getSchoolById = async (id) => {
  const school = await SchoolModel.findById(id);

  if (!school) {
    throw { status: 404, message: "School not found" };
  }

  return school;
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

export const updateSchool = async (id, data) => {
  const db = getDB();
  const connection = await db.getConnection();

  let newLogo = data.logo_url || null;

  try {
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

    // 🔥 delete old logo AFTER success
    if (newLogo && school.logo_url) {
      fs.unlink(`.${school.logo_url}`, () => {});
    }

    return { message: "School updated" };
  } catch (err) {
    await connection.rollback();

    // 🔥 cleanup newly uploaded logo if failed
    if (newLogo) {
      fs.unlink(`.${newLogo}`, () => {});
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

    return { message: "School deleted" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
