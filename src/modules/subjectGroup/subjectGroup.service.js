import { getDB } from "../../config/db.js";
import {
  validateCreateSubjectGroup,
  validateUpdateSubjectGroup,
  validateSubjectGroupStatus,
  validateSubjectGroupFilters,
} from "./subjectGroup.validation.js";
import { SubjectGroupModel } from "./subjectGroup.model.js";

export const createSubjectGroup = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSubjectGroup(data);

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
      SELECT id FROM subject_groups
      WHERE school_id = ? AND UPPER(name) = UPPER(?)
      `,
      [validated.school_id, validated.name],
    );

    if (nameExists) {
      throw {
        status: 409,
        message: `Subject group '${validated.name}' already exists in this school`,
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await SubjectGroupModel.create(conn, payload);
    const createdSubjectGroup = await SubjectGroupModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Subject group created",
      id,
      subjectGroup: createdSubjectGroup,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSubjectGroup = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateSubjectGroup(data);

    const existing = await SubjectGroupModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Subject group not found" };
    }

    await conn.beginTransaction();

    const targetSchoolId = validated.school_id || existing.school_id;

    // Duplicate check - Name
    if (validated.name) {
      const [[nameExists]] = await conn.query(
        `
        SELECT id FROM subject_groups
        WHERE school_id = ? AND UPPER(name) = UPPER(?) AND id != ?
        `,
        [targetSchoolId, validated.name, id],
      );

      if (nameExists) {
        throw {
          status: 409,
          message: `Subject group '${validated.name}' already exists in this school`,
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

    if (validated.description !== undefined) {
      fields.push("description = ?");
      values.push(validated.description);
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await SubjectGroupModel.update(conn, id, fields, values);

    const updatedSubjectGroup = await SubjectGroupModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Subject group updated",
      oldSubjectGroup: existing,
      updatedSubjectGroup,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSubjectGroupStatus = async (id, status, currentUser = null) => {
  const cleanStatus = validateSubjectGroupStatus(status);

  const existing = await SubjectGroupModel.findById(id);
  if (!existing) {
    throw { status: 404, message: "Subject group not found" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await SubjectGroupModel.update(
      conn,
      id,
      ["status = ?", "updated_by = ?"],
      [cleanStatus, currentUser?.id || null],
    );

    const updatedSubjectGroup = await SubjectGroupModel.findById(id, conn);

    await conn.commit();

    return {
      message: `Subject group status updated to ${cleanStatus}`,
      oldSubjectGroup: existing,
      updatedSubjectGroup,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSubjectGroups = async (query = {}) => {
  const filters = validateSubjectGroupFilters(query);
  return await SubjectGroupModel.findAll(filters);
};

export const getAllSubjectGroupsByToken = async (user, query = {}) => {
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

  const filters = validateSubjectGroupFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await SubjectGroupModel.findAll(filters);
};

export const getSubjectGroupById = async (id) => {
  const subjectGroup = await SubjectGroupModel.findById(id);

  if (!subjectGroup) {
    throw { status: 404, message: "Subject group not found" };
  }

  return subjectGroup;
};

export const deleteSubjectGroup = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await SubjectGroupModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Subject group not found" };
    }

    // Safety checks against referencing records
    const refs = await SubjectGroupModel.checkReferences(id, conn);

    if (refs.classSubjects > 0) {
      throw {
        status: 400,
        message: `Cannot delete subject group '${existing.name}'. It is currently assigned to ${refs.classSubjects} class subject mapping(s). Please remove or reassign associated class subjects first.`,
      };
    }

    await conn.beginTransaction();

    await SubjectGroupModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Subject group deleted",
      deletedSubjectGroup: existing,
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
          "Cannot delete this subject group because it is linked to existing records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingSubjectGroup = async (query = {}) => {
  const db = getDB();

  let { school_id, name, id } = query;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!name) {
    throw { status: 400, message: "name is required" };
  }

  school_id = Number(school_id);
  name = name.trim().toUpperCase();
  const excludeId = id || query.exclude_id || query.excludeId;

  let sql = `
    SELECT id, name FROM subject_groups 
    WHERE school_id = ? AND UPPER(name) = UPPER(?)
  `;
  const params = [school_id, name];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;
  const [[row]] = await db.query(sql, params);

  return {
    available: !row,
    exists: !!row,
    subject_group: row || null,
  };
};

export const checkExistingSubjectGroupByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

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

  return await checkExistingSubjectGroup({
    ...query,
    school_id: schoolId,
  });
};
