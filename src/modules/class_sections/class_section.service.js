import { getDB } from "../../config/db.js";
import { ClassSectionModel } from "./class_section.model.js";
import {
  validateCreateClassSection,
  validateUpdateClassSection,
} from "./class_section.validation.js";

export const createClassSection = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateClassSection(data);

    await conn.beginTransaction();

    const exists = await ClassSectionModel.findDuplicate(conn, validated);

    if (exists) {
      throw {
        status: 409,
        message: "Class section already exists",
      };
    }

    const id = await ClassSectionModel.create(conn, validated);

    await conn.commit();

    return {
      message: "Class section created",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllClassSections = async () => {
  const db = getDB();

  const [rows] = await db.query(`
  SELECT 
    cs.id,
    cs.school_id,
    sc.name AS school_name,

    cs.class_id,
    c.name AS class_name,

    cs.section_id,
    s.name AS section_name,

    cs.academic_year_id,
    ay.name AS academic_year,

    cs.class_teacher_id,
    cs.capacity,
    cs.status,
    cs.created_at

  FROM class_sections cs

  JOIN schools sc 
    ON cs.school_id = sc.id

  JOIN classes c 
    ON cs.class_id = c.id

  JOIN sections s 
    ON cs.section_id = s.id

  JOIN academic_years ay 
    ON cs.academic_year_id = ay.id

  ORDER BY cs.id DESC
`);

  return rows;
};

export const getClassSectionById = async (id) => {
  const db = getDB();

  if (!id) {
    throw { status: 400, message: "ID is required" };
  }

  const [rows] = await db.query(
    `
    SELECT 
      cs.id,
      cs.school_id,
      sc.name AS school_name,

      cs.class_id,
      c.name AS class_name,

      cs.section_id,
      s.name AS section_name,

      cs.academic_year_id,
      ay.name AS academic_year,

      cs.class_teacher_id,
      cs.capacity,
      cs.status,

      cs.created_at

    FROM class_sections cs

    JOIN schools sc 
      ON cs.school_id = sc.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN sections s 
      ON cs.section_id = s.id

    JOIN academic_years ay 
      ON cs.academic_year_id = ay.id

    WHERE cs.id = ?
    LIMIT 1
    `,
    [id],
  );

  if (rows.length === 0) {
    throw { status: 404, message: "Class section not found" };
  }

  return rows[0];
};

export const updateClassSection = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateClassSection(data);

    await conn.beginTransaction();

    const existing = await ClassSectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Not found" };
    }

    const fields = [];
    const values = [];

    if (validated.school_id !== undefined) {
      fields.push("school_id=?");
      values.push(validated.school_id);
    }

    if (validated.section_id !== undefined) {
      fields.push("section_id=?");
      values.push(validated.section_id);
    }

    if (validated.class_id !== undefined) {
      fields.push("class_id=?");
      values.push(validated.class_id);
    }

    if (validated.academic_year_id !== undefined) {
      fields.push("academic_year_id=?");
      values.push(validated.academic_year_id);
    }

    if (validated.class_teacher_id !== undefined) {
      fields.push("class_teacher_id=?");
      values.push(validated.class_teacher_id);
    }

    if (validated.capacity !== undefined) {
      fields.push("capacity=?");
      values.push(validated.capacity);
    }

    if (validated.status !== undefined) {
      fields.push("status=?");
      values.push(validated.status);
    }

    await ClassSectionModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteClassSection = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await ClassSectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Not found" };
    }

    await ClassSectionModel.delete(conn, id);

    await conn.commit();

    return { message: "Deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
