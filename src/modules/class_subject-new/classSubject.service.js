import { getDB } from "../../config/db.js";
import * as Model from "./classSubject.model.js";
import {
  validateCreateClassSubject,
  validateUpdateClassSubject,
} from "./classSubject.validation.js";

// classSubject.service.js
export const createClassSubject = async (data) => {
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

    const id = await Model.create(conn, validated);

    await conn.commit();

    return { message: "Created successfully", id };
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

export const getAllClassSubjects = async () => {
  const db = getDB();
  return await Model.getAll(db);
};

export const getClassSubjectById = async (id) => {
  const db = getDB();

  const data = await Model.findById(db, id);

  if (!data) throw { status: 404, message: "Not found" };

  return data;
};

export const updateClassSubject = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateClassSubject(data);

    await conn.beginTransaction();

    const fields = [];
    const values = [];

    Object.keys(validated).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(validated[key]);
    });

    await Model.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Updated successfully" };
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
    await conn.beginTransaction();

    await Model.remove(conn, id);

    await conn.commit();

    return { message: "Deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClassSubjectsDetailed = async (user) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");

  let query = `
    SELECT 
      cs.id,
      cs.class_section_id,
      cs.subject_id,
      cs.subject_group_id,
      cs.employee_id,
      cs.is_optional,
      cs.weekly_periods,
      cs.created_at,
      cs.updated_at,

      -- 🔥 SCHOOL
      sc.id AS school_id,
      sc.name AS school_name,

      -- 🔥 CLASS + SECTION
      c.id AS class_id,
      c.name AS class_name,
      s.id AS section_id,
      s.name AS section_name,

      CONCAT(c.name, '-', s.name) AS class_section_name,

      -- 🔥 ACADEMIC YEAR
      ay.id AS academic_year_id,
      ay.name AS academic_year_name,

      -- 🔥 SUBJECT
      sub.id AS subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,
      sub.subject_type,

      -- 🔥 SUBJECT GROUP
      sg.id AS subject_group_id,
      sg.name AS subject_group_name,

      -- 🔥 TEACHER
      e.id AS employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name

    FROM class_subjects cs

    JOIN class_sections csec ON cs.class_section_id = csec.id

    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id
    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id

    JOIN subjects sub ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id

    WHERE 1=1
  `;

  const values = [];

  // 🔒 NON ADMIN FILTER
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    query += ` AND sc.id = ?`;
    values.push(user.school_id);
  }

  query += ` ORDER BY cs.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getAllClassSubjectsByToken = async (user) => {
  const db = getDB();

  if (!user) {
    throw { status: 401, message: "Unauthorized" };
  }

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");

  let query = `
    SELECT 
      cs.id,
      cs.class_section_id,
      cs.subject_id,
      cs.subject_group_id,
      cs.employee_id,
      cs.is_optional,
      cs.weekly_periods,
      cs.created_at,
      cs.updated_at,

      -- 🏫 SCHOOL
      sc.id AS school_id,
      sc.name AS school_name,

      -- 🎓 CLASS
      c.id AS class_id,
      c.name AS class_name,

      -- 🧩 SECTION
      s.id AS section_id,
      s.name AS section_name,

      CONCAT(c.name, '-', s.name) AS class_section_name,

      -- 📅 ACADEMIC YEAR
      ay.id AS academic_year_id,
      ay.name AS academic_year_name,

      -- 📘 SUBJECT
      sub.id AS subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,
      sub.subject_type,

      -- 📦 SUBJECT GROUP
      sg.id AS subject_group_id,
      sg.name AS subject_group_name,

      -- 👨‍🏫 TEACHER
      e.id AS employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name

    FROM class_subjects cs

    JOIN class_sections csec ON cs.class_section_id = csec.id

    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id

    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id

    JOIN subjects sub ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id

    WHERE 1=1
  `;

  const values = [];

  // 🔒 NON-ADMIN → restrict by school
  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }

    query += ` AND sc.id = ?`;
    values.push(user.school_id);
  }

  query += ` ORDER BY cs.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const bulkAssignSubjects = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { class_section_id, subjects } = data;

    if (!class_section_id || !subjects?.length) {
      throw { status: 400, message: "class_section_id and subjects required" };
    }

    await conn.beginTransaction();

    // 🔴 Prevent duplicates inside request
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

      // 🔴 DB duplicate check
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

      // 🔥 Insert
      try {
        await Model.create(conn, {
          class_section_id,
          subject_id: item.subject_id,
          subject_group_id: item.subject_group_id || null,
          employee_id: item.employee_id || null,
          is_optional: item.is_optional === true || item.is_optional === "true",
          weekly_periods: item.weekly_periods ? Number(item.weekly_periods) : 0,
        });
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
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const bulkReplaceSubjects = async (data) => {
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

    // 🔴 Step 1: Validate class_section exists
    const [[section]] = await conn.query(
      `SELECT id FROM class_sections WHERE id=?`,
      [class_section_id],
    );

    if (!section) {
      throw { status: 404, message: "Class section not found" };
    }

    // 🔴 Step 2: Prevent duplicates in request
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

    // 🔴 Step 3: DELETE existing subjects (critical step)
    await conn.query(`DELETE FROM class_subjects WHERE class_section_id = ?`, [
      class_section_id,
    ]);

    // 🔴 Step 4: Insert new subjects
    for (const item of subjects) {
      try {
        await conn.query(
          `
          INSERT INTO class_subjects
          (class_section_id, subject_id, subject_group_id, employee_id, is_optional, weekly_periods)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            class_section_id,
            item.subject_id,
            item.subject_group_id || null,
            item.employee_id || null,
            item.is_optional === true || item.is_optional === "true",
            item.weekly_periods ? Number(item.weekly_periods) : 0,
          ],
        );
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
