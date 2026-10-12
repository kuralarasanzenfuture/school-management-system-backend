import { getDB } from "../../config/db.js";
import {
  validateCreateSubject,
  validateUpdateSubject,
  validateSubjectFilters,
} from "./subject.validation.js";
import { SubjectModel } from "./subject.model.js";

export const createSubject = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSubject(data);

    await conn.beginTransaction();

    // Check school exists
    const [[school]] = await conn.query(
      `SELECT id FROM schools WHERE id = ?`,
      [validated.school_id],
    );

    if (!school) {
      throw { status: 404, message: "School not found" };
    }

    // Duplicate check - Name
    const [[nameExists]] = await conn.query(
      `
      SELECT id FROM subjects
      WHERE school_id = ? AND UPPER(name) = UPPER(?)
      `,
      [validated.school_id, validated.name],
    );

    if (nameExists) {
      throw {
        status: 409,
        message: `Subject '${validated.name}' already exists in this school`,
      };
    }

    // Duplicate check - Code (if provided)
    if (validated.code) {
      const [[codeExists]] = await conn.query(
        `
        SELECT id FROM subjects
        WHERE school_id = ? AND UPPER(code) = UPPER(?)
        `,
        [validated.school_id, validated.code],
      );

      if (codeExists) {
        throw {
          status: 409,
          message: `Subject code '${validated.code}' already exists in this school`,
        };
      }
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await SubjectModel.create(conn, payload);
    const createdSubject = await SubjectModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Subject created",
      id,
      subject: createdSubject,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSubject = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateSubject(data);

    const existing = await SubjectModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Subject not found" };
    }

    await conn.beginTransaction();

    const targetSchoolId = validated.school_id || existing.school_id;

    // Duplicate check - Name
    if (validated.name) {
      const [[nameExists]] = await conn.query(
        `
        SELECT id FROM subjects
        WHERE school_id = ? AND UPPER(name) = UPPER(?) AND id != ?
        `,
        [targetSchoolId, validated.name, id],
      );

      if (nameExists) {
        throw {
          status: 409,
          message: `Subject '${validated.name}' already exists in this school`,
        };
      }
    }

    // Duplicate check - Code
    if (validated.code !== undefined && validated.code !== null) {
      const [[codeExists]] = await conn.query(
        `
        SELECT id FROM subjects
        WHERE school_id = ? AND UPPER(code) = UPPER(?) AND id != ?
        `,
        [targetSchoolId, validated.code, id],
      );

      if (codeExists) {
        throw {
          status: 409,
          message: `Subject code '${validated.code}' already exists in this school`,
        };
      }
    }

    const fields = [];
    const values = [];

    if (validated.school_id !== undefined) {
      fields.push("school_id = ?");
      values.push(validated.school_id);
    }

    if (validated.name !== undefined) {
      fields.push("name = ?");
      values.push(validated.name);
    }

    if (validated.code !== undefined) {
      fields.push("code = ?");
      values.push(validated.code);
    }

    if (validated.subject_type !== undefined) {
      fields.push("subject_type = ?");
      values.push(validated.subject_type);
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    // Always update updated_by
    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await SubjectModel.update(conn, id, fields, values);

    const updatedSubject = await SubjectModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Subject updated",
      oldSubject: existing,
      updatedSubject,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSubjectStatus = async (id, status, currentUser = null) => {
  if (!status) {
    throw { status: 400, message: "status is required" };
  }

  const normalized = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(normalized)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }

  const existing = await SubjectModel.findById(id);
  if (!existing) {
    throw { status: 404, message: "Subject not found" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await SubjectModel.update(
      conn,
      id,
      ["status = ?", "updated_by = ?"],
      [normalized, currentUser?.id || null],
    );

    const updatedSubject = await SubjectModel.findById(id, conn);

    await conn.commit();

    return {
      message: `Subject status updated to ${normalized}`,
      oldSubject: existing,
      updatedSubject,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSubjects = async (query = {}) => {
  const filters = validateSubjectFilters(query);
  return await SubjectModel.findAll(filters);
};

export const getAllSubjectsByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

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
  const isAdmin = roles.includes("ADMIN");

  const filters = validateSubjectFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await SubjectModel.findAll(filters);
};

export const getSubjectById = async (id) => {
  const subject = await SubjectModel.findById(id);

  if (!subject) {
    throw { status: 404, message: "Subject not found" };
  }

  return subject;
};

export const deleteSubject = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await SubjectModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Subject not found" };
    }

    // Safety checks against referencing records
    const refs = await SubjectModel.checkReferences(id, conn);

    if (refs.classSubjects > 0) {
      throw {
        status: 400,
        message: `Cannot delete subject '${existing.name}'. It is currently assigned to ${refs.classSubjects} class subject mapping(s). Please remove or reassign associated class subjects first.`,
      };
    }

    await conn.beginTransaction();

    await SubjectModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Subject deleted",
      deletedSubject: existing,
    };
  } catch (err) {
    await conn.rollback();
    if (
      err.code === "ER_ROW_IS_REFERENCED_2" ||
      err.errno === 1451 ||
      (err.message && err.message.includes("foreign key constraint fails"))
    ) {
      throw {
        status: 400,
        message:
          "Cannot delete this subject because it is linked to existing records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingSubject = async (query = {}) => {
  const db = getDB();

  let { school_id, name, code, id } = query;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name && !code) {
    throw { status: 400, message: "name or code is required" };
  }

  school_id = Number(school_id);
  name = name?.trim().toUpperCase();
  code = code?.trim().toUpperCase();
  const excludeId = id || query.exclude_id || query.excludeId;

  // Check name
  let nameExists = null;
  if (name) {
    let sql = `
      SELECT id, name, code FROM subjects 
      WHERE school_id = ? AND UPPER(name) = UPPER(?)
    `;
    const params = [school_id, name];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    sql += ` LIMIT 1`;
    const [[row]] = await db.query(sql, params);
    nameExists = row || null;
  }

  // Check code
  let codeExists = null;
  if (code) {
    let sql = `
      SELECT id, name, code FROM subjects 
      WHERE school_id = ? AND UPPER(code) = UPPER(?)
    `;
    const params = [school_id, code];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    sql += ` LIMIT 1`;
    const [[row]] = await db.query(sql, params);
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

export const checkExistingSubjectByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // Get user + school
  const [[dbUser]] = await db.query(
    `SELECT id, school_id FROM users WHERE id = ?`,
    [user.id],
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const schoolId = query.school_id || dbUser.school_id;
  if (!schoolId) {
    throw { status: 400, message: "School not assigned" };
  }

  return await checkExistingSubject({
    ...query,
    school_id: schoolId,
  });
};
