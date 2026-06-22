import { getDB } from "../../config/db.js";
import { SectionModel } from "./section.model.js";
import {
  validateCreateSection,
  validateUpdateSection,
} from "./section.validation.js";

export const createSection = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSection(data);

    // ❌ duplicate check
    const exists = await SectionModel.findDuplicate(
      validated.class_id,
      validated.name
    );

    if (exists) {
      throw { status: 409, message: "Section already exists" };
    }

    await conn.beginTransaction();

    const id = await SectionModel.create(conn, validated);

    await conn.commit();

    return {
      message: "Section created",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSection = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateSection(data);

    const existing = await SectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Section not found" };
    }

    // ❌ duplicate check
    if (validated.name) {
      const dup = await SectionModel.findDuplicate(
        existing.class_id,
        validated.name,
        id
      );

      if (dup) {
        throw { status: 409, message: "Section already exists" };
      }
    }

    const fields = [];
    const values = [];

    if (validated.name) {
      fields.push("name=?");
      values.push(validated.name);
    }

    if (validated.capacity !== undefined) {
      fields.push("capacity=?");
      values.push(validated.capacity);
    }

    if (validated.status) {
      fields.push("status=?");
      values.push(validated.status);
    }

    if (!fields.length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await conn.beginTransaction();

    await SectionModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Section updated" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// export const getAllSections = async () => {
//   return await SectionModel.getAll();
// };

export const getAllSections = async (filters) => {
  return await SectionModel.getAll(filters);
};

export const getSchoolTree = async () => {
  const rows = await SectionModel.getAllTreeData();

  const schoolsMap = {};

  for (const row of rows) {
    // 🔹 SCHOOL
    if (!schoolsMap[row.school_id]) {
      schoolsMap[row.school_id] = {
        id: row.school_id,
        name: row.school_name,
        classes: {}
      };
    }

    const school = schoolsMap[row.school_id];

    // 🔹 CLASS
    if (row.class_id) {
      if (!school.classes[row.class_id]) {
        school.classes[row.class_id] = {
          id: row.class_id,
          name: row.class_name,
          sections: []
        };
      }

      const cls = school.classes[row.class_id];

      // 🔹 SECTION
      if (row.section_id) {
        cls.sections.push({
          id: row.section_id,
          name: row.section_name
        });
      }
    }
  }

  // 🔥 Convert object → array
  const result = Object.values(schoolsMap).map((school) => ({
    id: school.id,
    name: school.name,
    classes: Object.values(school.classes)
  }));

  return result;
};

export const getAllSectionsByClassId = async (class_id) => {
  if (!class_id) {
    throw { status: 400, message: "class_id required" };
  }

  return await SectionModel.getAllClassById(class_id);
};

export const getSectionById = async (id) => {
  const section = await SectionModel.findById(id);

  if (!section) {
    throw { status: 404, message: "Section not found" };
  }

  return section;
};

export const deleteSection = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const existing = await SectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Section not found" };
    }

    await conn.beginTransaction();

    await SectionModel.delete(conn, id);

    await conn.commit();

    return { message: "Section deleted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};