import { getDB } from "../../config/db.js";
import { SectionModel } from "./section.model.js";
import {
  validateCreateSection,
  validateUpdateSection,
  validateSectionFilters,
} from "./section.validation.js";

export const createSection = async (data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateSection(data);

    await conn.beginTransaction();

    // Check class exists
    const [[cls]] = await conn.query(
      `SELECT id, school_id, name FROM classes WHERE id = ?`,
      [validated.class_id],
    );

    if (!cls) {
      throw { status: 404, message: "Class not found" };
    }

    // Duplicate check inside same class
    const exists = await SectionModel.findDuplicate(
      validated.class_id,
      validated.name,
      null,
      conn,
    );

    if (exists) {
      throw {
        status: 409,
        message: `Section '${validated.name}' already exists in class '${cls.name}'`,
      };
    }

    const payload = {
      ...validated,
      created_by: currentUser?.id || null,
    };

    const id = await SectionModel.create(conn, payload);
    const createdSection = await SectionModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Section created",
      id,
      section: createdSection,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSection = async (id, data, currentUser = null) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateSection(data);

    const existing = await SectionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Section not found" };
    }

    await conn.beginTransaction();

    const targetClassId = validated.class_id || existing.class_id;

    if (validated.class_id) {
      const [[cls]] = await conn.query(
        `SELECT id, name FROM classes WHERE id = ?`,
        [validated.class_id],
      );
      if (!cls) {
        throw { status: 404, message: "Target class not found" };
      }
    }

    // Duplicate check if name or class_id changed
    if (validated.name || validated.class_id) {
      const checkName = validated.name || existing.name;
      const dup = await SectionModel.findDuplicate(
        targetClassId,
        checkName,
        id,
        conn,
      );

      if (dup) {
        throw {
          status: 409,
          message: `Section '${checkName}' already exists in this class`,
        };
      }
    }

    const fields = [];
    const values = [];

    if (validated.class_id !== undefined) {
      fields.push("class_id = ?");
      values.push(validated.class_id);
    }

    if (validated.name !== undefined) {
      fields.push("name = ?");
      values.push(validated.name);
    }

    if (validated.capacity !== undefined) {
      fields.push("capacity = ?");
      values.push(validated.capacity);
    }

    if (validated.status !== undefined) {
      fields.push("status = ?");
      values.push(validated.status);
    }

    // Always update updated_by
    fields.push("updated_by = ?");
    values.push(currentUser?.id || null);

    await SectionModel.update(conn, id, fields, values);

    const updatedSection = await SectionModel.findById(id, conn);

    await conn.commit();

    return {
      message: "Section updated",
      oldSection: existing,
      updatedSection,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateSectionStatus = async (id, status, currentUser = null) => {
  if (!status) {
    throw { status: 400, message: "status is required" };
  }

  const normalized = String(status).toLowerCase().trim();
  if (!["active", "inactive"].includes(normalized)) {
    throw { status: 400, message: "Status must be 'active' or 'inactive'" };
  }

  const existing = await SectionModel.findById(id);
  if (!existing) {
    throw { status: 404, message: "Section not found" };
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await SectionModel.update(
      conn,
      id,
      ["status = ?", "updated_by = ?"],
      [normalized, currentUser?.id || null],
    );

    const updatedSection = await SectionModel.findById(id, conn);

    await conn.commit();

    return {
      message: `Section status updated to ${normalized}`,
      oldSection: existing,
      updatedSection,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllSections = async (query = {}) => {
  const filters = validateSectionFilters(query);
  return await SectionModel.findAll(filters);
};

export const getAllSectionsByToken = async (user, query = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  // Get user + roles
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

  const filters = validateSectionFilters(query);

  if (!isAdmin) {
    if (!dbUser.school_id) {
      throw { status: 400, message: "User has no school assigned" };
    }
    filters.school_id = dbUser.school_id;
  }

  return await SectionModel.findAll(filters);
};

export const getAllSectionsByClassId = async (class_id, query = {}) => {
  if (!class_id) {
    throw { status: 400, message: "class_id required" };
  }

  const filters = validateSectionFilters({ ...query, class_id });
  return await SectionModel.findAll(filters);
};

export const getSchoolTree = async (school_id = null) => {
  const rows = await SectionModel.getAllTreeData(school_id);

  const schoolsMap = {};

  for (const row of rows) {
    if (!schoolsMap[row.school_id]) {
      schoolsMap[row.school_id] = {
        id: row.school_id,
        name: row.school_name,
        classes: {},
      };
    }

    const school = schoolsMap[row.school_id];

    if (row.class_id) {
      if (!school.classes[row.class_id]) {
        school.classes[row.class_id] = {
          id: row.class_id,
          name: row.class_name,
          sections: [],
        };
      }

      const cls = school.classes[row.class_id];

      if (row.section_id) {
        cls.sections.push({
          id: row.section_id,
          name: row.section_name,
        });
      }
    }
  }

  return Object.values(schoolsMap).map((school) => ({
    id: school.id,
    name: school.name,
    classes: Object.values(school.classes),
  }));
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

    // Safety checks against referencing records
    const refs = await SectionModel.checkReferences(id, conn);

    if (refs.classSections > 0) {
      throw {
        status: 400,
        message: `Cannot delete section '${existing.name}'. It is currently referenced by ${refs.classSections} class section(s). Please remove or reassign associated records first.`,
      };
    }

    await conn.beginTransaction();

    await SectionModel.delete(conn, id);

    await conn.commit();

    return {
      message: "Section deleted",
      deletedSection: existing,
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
          "Cannot delete this section because it is linked to existing records. Please remove or reassign associated records first.",
      };
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const checkExistingSection = async (data = {}) => {
  const db = getDB();

  let { class_id, name, id } = data;

  if (!class_id) {
    throw { status: 400, message: "class_id is required" };
  }

  if (!name?.trim()) {
    throw { status: 400, message: "name is required" };
  }

  class_id = Number(class_id);
  name = name.trim().toUpperCase();
  const excludeId = id || data.exclude_id || data.excludeId;

  let sql = `
    SELECT
      s.id,
      s.class_id,
      c.name AS class_name,
      s.name AS section_name,
      s.capacity,
      s.status,
      s.created_by,
      s.updated_by
    FROM sections s
    JOIN classes c ON c.id = s.class_id
    WHERE s.class_id = ?
      AND UPPER(s.name) = UPPER(?)
  `;
  const params = [class_id, name];

  if (excludeId) {
    sql += ` AND s.id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    section: existing || null,
  };
};

export const checkExistingSectionByToken = async (user, data = {}) => {
  const db = getDB();

  if (!user?.id) {
    throw { status: 401, message: "Unauthorized" };
  }

  let { class_id, name } = data;

  if (!class_id) {
    throw { status: 400, message: "class_id is required" };
  }

  if (!name?.trim()) {
    throw { status: 400, message: "name is required" };
  }

  // Get user + school
  const [[dbUser]] = await db.query(
    `
    SELECT id, school_id
    FROM users
    WHERE id = ?
    `,
    [user.id],
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found" };
  }

  const excludeId = data.id || data.exclude_id || data.excludeId;

  let sql = `
    SELECT
      s.id,
      s.class_id,
      c.name AS class_name,
      s.name AS section_name,
      s.capacity,
      s.status,
      s.created_by,
      s.updated_by
    FROM sections s
    JOIN classes c ON c.id = s.class_id
    WHERE s.class_id = ?
      AND UPPER(s.name) = UPPER(?)
  `;
  const params = [Number(class_id), name.trim()];

  if (excludeId) {
    sql += ` AND s.id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [[existing]] = await db.query(sql, params);

  return {
    available: !existing,
    exists: !!existing,
    section: existing || null,
  };
};
