import { getDB } from "../../config/db.js";
import {
  validateCreateSubject,
  validateUpdateSubject,
} from "./subject.validation.js";
import { SubjectModel } from "./subject.model.js";

// export const createSubject = async (data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateCreateSubject(data);

//     await conn.beginTransaction();

//     const exists = await SubjectModel.findDuplicate(
//       conn,
//       validated.school_id,
//       validated.name,
//       validated.code,
//     );

//     if (exists) {
//       throw { status: 409, message: "Subject already exists" };
//     }

//     const id = await SubjectModel.create(conn, validated);

//     await conn.commit();

//     return { message: "Subject created", id };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

export const createSubject = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSubject(data);

    await conn.beginTransaction();

    // 🔴 1. CHECK SCHOOL EXISTS
    const [[school]] = await conn.query(`SELECT id FROM schools WHERE id = ?`, [
      validated.school_id,
    ]);

    if (!school) {
      throw { status: 400, message: "Invalid school_id" };
    }

    // 🔴 2. DUPLICATE CHECK - NAME (MANDATORY)
    const [[nameExists]] = await conn.query(
      `
      SELECT id FROM subjects
      WHERE school_id = ? AND name = ?
      `,
      [validated.school_id, validated.name],
    );

    if (nameExists) {
      throw { status: 409, message: "Subject name already exists" };
    }

    // 🔴 3. DUPLICATE CHECK - CODE (ONLY IF PROVIDED)
    if (validated.code) {
      const [[codeExists]] = await conn.query(
        `
        SELECT id FROM subjects
        WHERE school_id = ? AND code = ?
        `,
        [validated.school_id, validated.code],
      );

      if (codeExists) {
        throw { status: 409, message: "Subject code already exists" };
      }
    }

    // 🔴 4. CREATE
    const id = await SubjectModel.create(conn, validated);

    await conn.commit();

    return {
      message: "Subject created",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSubjects = async () => {
  const db = getDB();

  const [rows] = await db.query(`
    SELECT 
      s.*,
      sc.name AS school_name
    FROM subjects s
    JOIN schools sc ON s.school_id = sc.id
    ORDER BY s.id DESC
  `);

  return rows;
};

export const getAllSubjectsByToken = async (user) => {
  const db = getDB();

  const [[dbUser]] = await db.query(
    `
    SELECT 
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

  const roles = dbUser.roles ? dbUser.roles.split(",") : [];
  const isAdmin = roles.includes("ADMIN");

  let query = `
    SELECT s.*, sc.name AS school_name
    FROM subjects s
    JOIN schools sc ON s.school_id = sc.id
  `;

  const values = [];

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "No school assigned" };
    }
    query += " WHERE s.school_id=?";
    values.push(dbUser.school_id);
  }

  query += " ORDER BY s.id DESC";

  const [rows] = await db.query(query, values);

  return rows;
};

export const getSubjectById = async (id) => {
  const db = getDB();

  const [rows] = await db.query(
    `
    SELECT 
      s.*,
      sc.name AS school_name
    FROM subjects s
    JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ?
    `,
    [id],
  );

  if (!rows.length) {
    throw { status: 404, message: "Subject not found" };
  }

  return rows[0];
};

// export const updateSubject = async (id, data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateUpdateSubject(data);

//     await conn.beginTransaction();

//     const subject = await SubjectModel.findById(id);
//     if (!subject) {
//       throw { status: 404, message: "Subject not found" };
//     }

//     if (validated.name || validated.code) {
//       const exists = await SubjectModel.findDuplicate(
//         conn,
//         subject.school_id,
//         validated.name || subject.name,
//         validated.code || subject.code,
//         id,
//       );

//       if (exists) {
//         throw { status: 409, message: "Duplicate subject" };
//       }
//     }

//     const fields = [];
//     const values = [];

//     Object.keys(validated).forEach((key) => {
//       fields.push(`${key}=?`);
//       values.push(validated[key]);
//     });

//     await SubjectModel.update(conn, id, fields, values);

//     await conn.commit();

//     return { message: "Subject updated" };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

export const updateSubject = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateSubject(data);

    await conn.beginTransaction();

    const subject = await SubjectModel.findById(id);
    if (!subject) {
      throw { status: 404, message: "Subject not found" };
    }

    // 🔴 1. CHECK NAME DUPLICATE (only if updating name)
    if (validated.name) {
      const [[nameExists]] = await conn.query(
        `
        SELECT id FROM subjects
        WHERE school_id = ? AND name = ? AND id != ?
        `,
        [subject.school_id, validated.name, id],
      );

      if (nameExists) {
        throw { status: 409, message: "Subject name already exists" };
      }
    }

    // 🔴 2. CHECK CODE DUPLICATE (only if updating code AND not null)
    if (validated.code !== undefined && validated.code !== null) {
      const [[codeExists]] = await conn.query(
        `
        SELECT id FROM subjects
        WHERE school_id = ? AND code = ? AND id != ?
        `,
        [subject.school_id, validated.code, id],
      );

      if (codeExists) {
        throw { status: 409, message: "Subject code already exists" };
      }
    }

    // 🔴 3. BUILD UPDATE
    const fields = [];
    const values = [];

    Object.keys(validated).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(validated[key]);
    });

    if (!fields.length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await SubjectModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Subject updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteSubject = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const subject = await SubjectModel.findById(id);
    if (!subject) {
      throw { status: 404, message: "Subject not found" };
    }

    await SubjectModel.delete(conn, id);

    await conn.commit();

    return { message: "Subject deleted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingSubject = async (query) => {
  const db = getDB();

  let { school_id, name, code } = query;

  // 🔴 VALIDATION
  if (!school_id) {
    throw { status: 400, message: "school_id required" };
  }

  if (!name && !code) {
    throw { status: 400, message: "name or code required" };
  }

  school_id = Number(school_id);
  name = name?.trim().toUpperCase();
  code = code?.trim().toUpperCase();

  // 🔴 CHECK SCHOOL EXISTS
  const [[school]] = await db.query(`SELECT id FROM schools WHERE id=?`, [
    school_id,
  ]);

  if (!school) {
    throw { status: 400, message: "Invalid school_id" };
  }

  // 🔴 CHECK NAME
  let nameExists = null;
  if (name) {
    const [[row]] = await db.query(
      `SELECT id, name, code FROM subjects 
       WHERE school_id=? AND name=?`,
      [school_id, name],
    );
    nameExists = row || null;
  }

  // 🔴 CHECK CODE (only if provided)
  let codeExists = null;
  if (code) {
    const [[row]] = await db.query(
      `SELECT id, name, code FROM subjects 
       WHERE school_id=? AND code=?`,
      [school_id, code],
    );
    codeExists = row || null;
  }

  return {
    available: !nameExists && !codeExists,
    exists: !!nameExists || !!codeExists,
    match: {
      name: nameExists,
      code: codeExists,
    },
  };
};
