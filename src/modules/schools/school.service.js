import { getDB } from "../../config/db.js";
import { SchoolModel } from "./school.model.js";
import {
  validateCreateSchool,
  validateUpdateSchool
} from "./school.validation.js";

export const generateSchoolCode = async (connection) => {
  const [[last]] = await connection.query(
    `SELECT id FROM schools ORDER BY id DESC LIMIT 1`
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
export const createSchool = async (data) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateCreateSchool(data);

    await connection.beginTransaction();

    // 🔥 GENERATE CODE HERE
    const code = await generateSchoolCode(connection);

    // 🔴 SAFETY CHECK (rare but needed)
    const [exists] = await connection.query(
      `SELECT id FROM schools WHERE code=?`,
      [code]
    );

    if (exists.length) {
      throw { status: 409, message: "Code generation conflict" };
    }

    const schoolId = await SchoolModel.create(connection, {
      ...validated,
      code
    });

    await connection.commit();

    return {
      message: "School created",
      id: schoolId,
      code
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getAllSchools = async () => {
  return await SchoolModel.getAll();
};


export const getSchoolById = async (id) => {
  const school = await SchoolModel.findById(id);

  if (!school) {
    throw { status: 404, message: "School not found" };
  }

  return school;
};


export const updateSchool = async (id, data) => {
  const db = getDB();
  const connection = await db.getConnection();

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

    if (fields.length) {
      await connection.beginTransaction();

      await SchoolModel.update(connection, id, fields, values);

      await connection.commit();
    }

    return { message: "School updated" };

  } catch (err) {
    await connection.rollback();
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