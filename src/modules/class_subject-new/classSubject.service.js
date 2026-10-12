import { getDB } from "../../config/db.js";
import * as Model from "./classSubject.model.js";
import {
  validateCreateClassSubject,
  validateUpdateClassSubject,
  validateClassSubjectFilters,
} from "./classSubject.validation.js";

// classSubject.service.js
export const createClassSubject = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateClassSubject(data);

    await conn.beginTransaction();

    const exists = await Model.findDuplicate(
      conn,
      validated.class_section_id,
      validated.subject_id,
    );

    if (exists) {
      throw {
        status: 409,
        message: "Subject already assigned to this class section",
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await Model.create(conn, payload);
    const createdClassSubject = await Model.findById(conn, id);

    await conn.commit();

    return {
      message: "Created successfully",
      id,
      classSubject: createdClassSubject,
    };
  } catch (err) {
    await conn.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      throw { status: 409, message: "Duplicate subject assignment" };
    }

    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClassSubjects = async (query = {}) => {
  const db = getDB();
  const filters = validateClassSubjectFilters(query);
  return await Model.findAll(db, filters);
};

export const getClassSubjectById = async (id) => {
  const db = getDB();
  const data = await Model.findById(db, id);
  if (!data) throw { status: 404, message: "Class subject not found" };
  return data;
};

export const updateClassSubject = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Class subject not found" };
    }

    const validated = validateUpdateClassSubject(data);

    await conn.beginTransaction();

    const fields = [];
    const values = [];

    Object.keys(validated).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(validated[key]);
    });

    fields.push("updated_by=?");
    values.push(currentUser?.id || null);

    await Model.update(conn, id, fields, values);

    const updatedClassSubject = await Model.findById(conn, id);

    await conn.commit();

    return {
      message: "Updated successfully",
      oldClassSubject: existing,
      updatedClassSubject,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteClassSubject = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await Model.findById(db, id);
    if (!existing) {
      throw { status: 404, message: "Class subject not found" };
    }

    await conn.beginTransaction();

    await Model.remove(conn, id);

    await conn.commit();

    return {
      message: "Deleted successfully",
      deletedClassSubject: existing,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClassSubjectsDetailed = async (user, query = {}) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");
  const filters = validateClassSubjectFilters(query);

  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = user.school_id;
  }

  return await Model.findAll(db, filters);
};

export const getAllClassSubjectsByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user) {
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

  const filters = validateClassSubjectFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await Model.findAll(db, filters);
};

export const bulkAssignSubjects = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { class_section_id, subjects } = data;

    if (!class_section_id || !subjects?.length) {
      throw { status: 400, message: "class_section_id and subjects required" };
    }

    await conn.beginTransaction();

    const seen = new Set();
    const createdIds = [];

    for (const item of subjects) {
      if (!item.subject_id) {
        throw { status: 400, message: "subject_id required in each item" };
      }

      const key = `${class_section_id}-${item.subject_id}`;

      if (seen.has(key)) {
        throw {
          status: 400,
          message: `Duplicate subject ${item.subject_id} in request`,
        };
      }

      seen.add(key);

      const exists = await Model.findDuplicate(
        conn,
        class_section_id,
        item.subject_id,
      );

      if (exists) {
        throw {
          status: 409,
          message: `Subject ${item.subject_id} already assigned to this class section`,
        };
      }

      try {
        const id = await Model.create(conn, {
          class_section_id,
          subject_id: item.subject_id,
          subject_group_id: item.subject_group_id || null,
          employee_id: item.employee_id || null,
          is_optional: item.is_optional === true || item.is_optional === "true" || item.is_optional === 1,
          weekly_periods: item.weekly_periods ? Number(item.weekly_periods) : 0,
          created_by: currentUser?.id || null,
        });
        createdIds.push(id);
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          throw {
            status: 409,
            message: `Duplicate DB entry for subject ${item.subject_id}`,
          };
        }
        throw err;
      }
    }

    await conn.commit();

    return {
      message: "Bulk subjects assigned successfully",
      count: subjects.length,
      ids: createdIds,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const bulkReplaceSubjects = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { class_section_id, subjects } = data;

    if (!class_section_id) {
      throw { status: 400, message: "class_section_id required" };
    }

    if (!Array.isArray(subjects)) {
      throw { status: 400, message: "subjects must be array" };
    }

    await conn.beginTransaction();

    const [[section]] = await conn.query(
      `SELECT id FROM class_sections WHERE id=?`,
      [class_section_id],
    );

    if (!section) {
      throw { status: 404, message: "Class section not found" };
    }

    const seen = new Set();
    for (const item of subjects) {
      if (!item.subject_id) {
        throw { status: 400, message: "subject_id required in each item" };
      }
      const key = `${class_section_id}-${item.subject_id}`;
      if (seen.has(key)) {
        throw {
          status: 400,
          message: `Duplicate subject ${item.subject_id} in request`,
        };
      }
      seen.add(key);
    }

    await conn.query(`DELETE FROM class_subjects WHERE class_section_id = ?`, [
      class_section_id,
    ]);

    for (const item of subjects) {
      try {
        await Model.create(conn, {
          class_section_id,
          subject_id: item.subject_id,
          subject_group_id: item.subject_group_id || null,
          employee_id: item.employee_id || null,
          is_optional: item.is_optional === true || item.is_optional === "true" || item.is_optional === 1,
          weekly_periods: item.weekly_periods ? Number(item.weekly_periods) : 0,
          created_by: currentUser?.id || null,
        });
      } catch (err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          throw {
            status: 400,
            message: `Invalid foreign key (subject_id=${item.subject_id} or employee_id=${item.employee_id})`,
          };
        }
        if (err.code === "ER_DUP_ENTRY") {
          throw {
            status: 409,
            message: `Duplicate DB entry for subject ${item.subject_id}`,
          };
        }
        throw err;
      }
    }

    await conn.commit();

    return {
      message: "Subjects replaced successfully",
      count: subjects.length,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingClassSubject = async (query) => {
  const db = getDB();

  const { class_section_id, subject_id } = query;

  if (!class_section_id || !subject_id) {
    throw {
      status: 400,
      message: "class_section_id and subject_id required",
    };
  }

  const [[row]] = await db.query(
    `
    SELECT 
      cs.id,
      sub.id AS subject_id,
      sub.name AS subject_name,
      c.id AS class_id,
      c.name AS class_name,
      s.id AS section_id,
      s.name AS section_name,
      sc.id AS school_id,
      sc.name AS school_name
    FROM class_subjects cs
    JOIN class_sections csec ON cs.class_section_id = csec.id
    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id
    JOIN schools sc ON csec.school_id = sc.id
    JOIN subjects sub ON cs.subject_id = sub.id
    WHERE cs.class_section_id = ?
      AND cs.subject_id = ?
    `,
    [class_section_id, subject_id],
  );

  return {
    available: !row,
    exists: !!row,
    data: row || null,
  };
};
