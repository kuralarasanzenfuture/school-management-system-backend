import { getDB } from "../../config/db.js";
import * as Model from "./classSubject.model.js";
import {
  validateCreateClassSubject,
  validateUpdateClassSubject,
} from "./classSubject.validation.js";

/* =========================================
   CREATE
========================================= */
export const createClassSubject = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateClassSubject(data);

    await conn.beginTransaction();

    const exists = await Model.findDuplicate(
      conn,
      validated.class_id,
      validated.subject_id,
      validated.academic_year_id,
    );

    if (exists) {
      throw { status: 409, message: "Class subject already exists" };
    }

    const id = await Model.create(conn, validated);

    await conn.commit();

    return { message: "Created successfully", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================================
   GET ALL
========================================= */
export const getAllClassSubjects = async () => {
  const db = getDB();
  return await Model.getAll(db);
};

/* =========================================
   GET BY ID
========================================= */
export const getClassSubjectById = async (id) => {
  const db = getDB();

  const data = await Model.findById(db, id);
  if (!data) throw { status: 404, message: "Not found" };

  return data;
};

/* =========================================
   UPDATE
========================================= */
export const updateClassSubject = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateClassSubject(data);

    await conn.beginTransaction();

    const existing = await Model.findById(conn, id);
    if (!existing) throw { status: 404, message: "Not found" };

    if (
      validated.class_id ||
      validated.subject_id ||
      validated.academic_year_id
    ) {
      const exists = await Model.findDuplicate(
        conn,
        validated.class_id || existing.class_id,
        validated.subject_id || existing.subject_id,
        validated.academic_year_id || existing.academic_year_id,
        id,
      );

      if (exists) {
        throw { status: 409, message: "Duplicate class subject" };
      }
    }

    await Model.update(conn, id, validated);

    await conn.commit();

    return { message: "Updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================================
   DELETE
========================================= */
export const deleteClassSubject = async (id) => {
  const db = getDB();

  const exists = await Model.findById(db, id);
  if (!exists) throw { status: 404, message: "Not found" };

  await Model.remove(db, id);

  return { message: "Deleted successfully" };
};

/* =========================================
   TOKEN FILTER
========================================= */
export const getAllClassSubjectsByToken = async (user) => {
  const db = getDB();

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");

  if (!isAdmin && !user.school_id) {
    throw { status: 400, message: "School not assigned" };
  }

  return await Model.getAllBySchool(db, isAdmin ? null : user.school_id);
};

/* =========================================
   CHECK EXISTING
========================================= */
export const checkExistingClassSubject = async ({
  class_id,
  subject_id,
  academic_year_id,
}) => {
  const db = getDB();

  if (!class_id || !subject_id || !academic_year_id) {
    throw { status: 400, message: "Missing fields" };
  }

  const exists = await Model.findDuplicate(
    db,
    class_id,
    subject_id,
    academic_year_id,
  );

  return {
    available: !exists,
    exists: !!exists,
  };
};

/* =========================================
   GET ALL WITH DETAILS
========================================= */

export const getAllClassSubjectsDetailed = async (user) => {
  const db = getDB();

  const isAdmin = user.role === "ADMIN" || user.roles?.includes("ADMIN");

  if (!isAdmin && !user.school_id) {
    throw { status: 400, message: "School not assigned" };
  }

  return await Model.getAllWithDetails(db, isAdmin ? null : user.school_id);
};

/* =========================================
   BULK ASSIGN SUBJECTS
========================================= */

export const bulkAssignSubjects = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { school_id, class_id, academic_year_id, subjects } = data;

    if (!school_id || !class_id || !academic_year_id || !subjects?.length) {
      throw { status: 400, message: "Missing required fields" };
    }

    await conn.beginTransaction();

    // 🔴 check duplicates inside request
    const seen = new Set();

    for (const item of subjects) {
      const key = `${school_id}-${class_id}-${item.subject_id}-${academic_year_id}`;

      if (seen.has(key)) {
        throw {
          status: 400,
          message: `Duplicate subject ${item.subject_id} in request`,
        };
      }

      seen.add(key);

      const exists = await Model.findDuplicate(
        conn,
        school_id,
        class_id,
        item.subject_id,
        academic_year_id,
      );

      if (exists) {
        throw {
          status: 409,
          message: `Subject ${item.subject_id} already assigned`,
        };
      }

      try {
        await Model.create(conn, {
          school_id,
          class_id,
          subject_id: item.subject_id,
          subject_group_id: item.subject_group_id || null,
          employee_id: item.employee_id || null,
          academic_year_id,
          is_optional: item.is_optional === true || item.is_optional === "true",
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

    return { message: "Bulk subjects assigned successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
