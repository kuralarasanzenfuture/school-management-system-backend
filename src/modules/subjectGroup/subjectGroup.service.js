import { getDB } from "../../config/db.js";
import { SubjectGroupModel } from "./subjectGroup.model.js";
import {
    validateCreateSubjectGroup,
    validateUpdateSubjectGroup,
} from "./subjectGroup.validation.js";

export const createSubjectGroup = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSubjectGroup(data);

    await conn.beginTransaction();

    // 🔴 check school
    const [[school]] = await conn.query(`SELECT id FROM schools WHERE id=?`, [
      validated.school_id,
    ]);

    if (!school) {
      throw { status: 400, message: "Invalid school_id" };
    }

    // 🔴 duplicate
    const exists = await SubjectGroupModel.findDuplicate(
      conn,
      validated.school_id,
      validated.name,
    );

    if (exists) {
      throw { status: 409, message: "Subject group already exists" };
    }

    const id = await SubjectGroupModel.create(conn, validated);

    await conn.commit();

    return { message: "Subject group created", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSubjectGroups = async () => {
  const db = getDB();

  const [rows] = await db.query(`
    SELECT sg.*, s.name AS school_name
    FROM subject_groups sg
    JOIN schools s ON sg.school_id = s.id
    ORDER BY sg.id DESC
  `);

  return rows;
};

export const getSubjectGroupById = async (id) => {
  const db = getDB();

  const [rows] = await db.query(
    `
    SELECT sg.*, s.name AS school_name
    FROM subject_groups sg
    JOIN schools s ON sg.school_id = s.id
    WHERE sg.id=?
    `,
    [id],
  );

  if (!rows.length) {
    throw { status: 404, message: "Subject group not found" };
  }

  return rows[0];
};

export const updateSubjectGroup = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateSubjectGroup(data);

    await conn.beginTransaction();

    const group = await SubjectGroupModel.findById(id);
    if (!group) {
      throw { status: 404, message: "Subject group not found" };
    }

    if (validated.name) {
      const exists = await SubjectGroupModel.findDuplicate(
        conn,
        group.school_id,
        validated.name,
        id,
      );

      if (exists) {
        throw {
          status: 409,
          message: "Subject group name already exists",
        };
      }
    }

    const fields = [];
    const values = [];

    Object.keys(validated).forEach((key) => {
      fields.push(`${key}=?`);
      values.push(validated[key]);
    });

    await SubjectGroupModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Subject group updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteSubjectGroup = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const group = await SubjectGroupModel.findById(id);
    if (!group) {
      throw { status: 404, message: "Subject group not found" };
    }

    await SubjectGroupModel.delete(conn, id);

    await conn.commit();

    return { message: "Subject group deleted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSubjectGroupsByToken = async (user) => {
  const db = getDB();

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");

  let query = `
    SELECT sg.*, s.name AS school_name
    FROM subject_groups sg
    JOIN schools s ON sg.school_id = s.id
  `;

  const values = [];

  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` WHERE sg.school_id=?`;
    values.push(user.school_id);
  }

  query += ` ORDER BY sg.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const checkExistingSubjectGroup = async (query) => {
  const db = getDB();

  let { school_id, name } = query;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name) throw { status: 400, message: "name required" };

  school_id = Number(school_id);
  name = name.trim().toUpperCase();

  const [[row]] = await db.query(
    `
    SELECT id, name
    FROM subject_groups
    WHERE school_id=? AND name=?
    `,
    [school_id, name],
  );

  return {
    available: !row,
    exists: !!row,
    subject_group: row || null,
  };
};
