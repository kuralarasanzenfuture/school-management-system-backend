import { getDB } from "../../config/db.js";
import {
  validateCreateAcademicYear,
  validateUpdateAcademicYear,
} from "./academicYear.validation.js";
import { AcademicYearModel } from "./academicYear.model.js";

const generateAcademicYearName = (startDate, endDate) => {
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();

  return `${startYear}-${endYear}`;
};

const isCurrentDateRange = (start, end) => {
  const today = new Date();

  return (
    today >= new Date(start) &&
    today <= new Date(end)
  );
};


// export const createAcademicYear = async (data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateCreateAcademicYear(data);

//     await conn.beginTransaction();

//     // ❌ duplicate check
//     const exists = await AcademicYearModel.findByName(
//       conn,
//       validated.school_id,
//       validated.name
//     );

//     if (exists) {
//       throw { status: 409, message: "Academic year already exists" };
//     }

//     // ✅ only one current
//     if (validated.is_current) {
//       await AcademicYearModel.setAllNotCurrent(conn, validated.school_id);
//     }

//     const id = await AcademicYearModel.create(conn, validated);

//     await conn.commit();

//     return {
//       message: "Academic year created",
//       id,
//     };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

/* --------- name auto generate --------- */

// export const createAcademicYear = async (data) => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     const validated = validateCreateAcademicYear(data);

//     const name = generateAcademicYearName(
//       validated.start_date,
//       validated.end_date
//     );

//     await connection.beginTransaction();

//     // ❌ Prevent duplicate year
//     const [[exists]] = await connection.query(
//       `SELECT id FROM academic_years 
//        WHERE school_id=? AND name=?`,
//       [validated.school_id, name]
//     );

//     if (exists) {
//       throw { status: 409, message: "Academic year already exists" };
//     }

//     // ❌ Prevent overlapping dates
//     const [overlap] = await connection.query(
//       `
//       SELECT id FROM academic_years
//       WHERE school_id = ?
//       AND (
//         (? BETWEEN start_date AND end_date)
//         OR
//         (? BETWEEN start_date AND end_date)
//       )
//       `,
//       [validated.school_id, validated.start_date, validated.end_date]
//     );

//     if (overlap.length) {
//       throw { status: 400, message: "Academic year overlaps existing one" };
//     }

//     // ✅ Ensure only one current year
//     if (validated.is_current) {
//       await connection.query(
//         `UPDATE academic_years 
//          SET is_current = 0 
//          WHERE school_id=?`,
//         [validated.school_id]
//       );
//     }

//     // ✅ Insert
//     const [result] = await connection.query(
//       `
//       INSERT INTO academic_years
//       (school_id, name, start_date, end_date, is_current, status)
//       VALUES (?, ?, ?, ?, ?, ?)
//       `,
//       [
//         validated.school_id,
//         name,
//         validated.start_date,
//         validated.end_date,
//         validated.is_current,
//         validated.status,
//       ]
//     );

//     await connection.commit();

//     return {
//       message: "Academic year created",
//       id: result.insertId,
//       name,
//     };

//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// };

/* ----------------- is_current --------- */

export const createAcademicYear = async (data) => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    const validated = validateCreateAcademicYear(data);

    const name = generateAcademicYearName(
      validated.start_date,
      validated.end_date
    );

    // 🔥 AUTO DETERMINE CURRENT
    const isCurrent = isCurrentDateRange(
      validated.start_date,
      validated.end_date
    );

    await connection.beginTransaction();

    // ❌ Duplicate check
    const [[exists]] = await connection.query(
      `SELECT id FROM academic_years 
       WHERE school_id=? AND name=?`,
      [validated.school_id, name]
    );

    if (exists) {
      throw { status: 409, message: "Academic year already exists" };
    }

    // ❌ Overlap check
    const [overlap] = await connection.query(
      `
      SELECT id FROM academic_years
      WHERE school_id = ?
      AND (
        (? BETWEEN start_date AND end_date)
        OR
        (? BETWEEN start_date AND end_date)
      )
      `,
      [validated.school_id, validated.start_date, validated.end_date]
    );

    if (overlap.length) {
      throw { status: 400, message: "Academic year overlaps existing one" };
    }

    // 🔥 ONLY ONE CURRENT
    if (isCurrent) {
      await connection.query(
        `UPDATE academic_years 
         SET is_current = 0 
         WHERE school_id=?`,
        [validated.school_id]
      );
    }

    // ✅ Insert
    const [result] = await connection.query(
      `
      INSERT INTO academic_years
      (school_id, name, start_date, end_date, is_current, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        validated.school_id,
        name,
        validated.start_date,
        validated.end_date,
        isCurrent ? 1 : 0,
        validated.status,
      ]
    );

    await connection.commit();

    return {
      message: "Academic year created",
      id: result.insertId,
      name,
      is_current: isCurrent,
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


// export const updateAcademicYear = async (id, data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateUpdateAcademicYear(data);

//     await conn.beginTransaction();

//     const existing = await AcademicYearModel.findById(conn, id);
//     if (!existing) {
//       throw { status: 404, message: "Academic year not found" };
//     }

//     const fields = [];
//     const values = [];

//     if (validated.name) {
//       fields.push("name=?");
//       values.push(validated.name);
//     }

//     if (validated.start_date) {
//       fields.push("start_date=?");
//       values.push(validated.start_date);
//     }

//     if (validated.end_date) {
//       fields.push("end_date=?");
//       values.push(validated.end_date);
//     }

//     if (validated.status) {
//       fields.push("status=?");
//       values.push(validated.status);
//     }

//     if (validated.is_current !== undefined) {
//       if (validated.is_current) {
//         await AcademicYearModel.setAllNotCurrent(conn, existing.school_id);
//       }
//       fields.push("is_current=?");
//       values.push(validated.is_current ? 1 : 0);
//     }

//     if (!fields.length) {
//       throw { status: 400, message: "Nothing to update" };
//     }

//     await AcademicYearModel.update(conn, id, fields, values);

//     await conn.commit();

//     return { message: "Academic year updated" };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };


/* -------------------name auto generate ------------------------------------------------------- */

// export const updateAcademicYear = async (id, data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateUpdateAcademicYear(data);

//     await conn.beginTransaction();

//     const existing = await AcademicYearModel.findById(conn, id);
//     if (!existing) {
//       throw { status: 404, message: "Academic year not found" };
//     }

//     const fields = [];
//     const values = [];

//     // =========================
//     // 🔴 DATE UPDATE + NAME AUTO GENERATE
//     // =========================

//     const newStart = validated.start_date || existing.start_date;
//     const newEnd = validated.end_date || existing.end_date;

//     if (validated.start_date || validated.end_date) {
//       if (new Date(newStart) >= new Date(newEnd)) {
//         throw { status: 400, message: "Invalid date range" };
//       }

//       const newName = generateAcademicYearName(newStart, newEnd);

//       // ❌ prevent duplicate
//       const [[dup]] = await conn.query(
//         `SELECT id FROM academic_years 
//          WHERE school_id=? AND name=? AND id!=?`,
//         [existing.school_id, newName, id]
//       );

//       if (dup) {
//         throw { status: 409, message: "Academic year already exists" };
//       }

//       // ❌ prevent overlap
//       const [overlap] = await conn.query(
//         `
//         SELECT id FROM academic_years
//         WHERE school_id = ?
//         AND id != ?
//         AND (
//           (? BETWEEN start_date AND end_date)
//           OR
//           (? BETWEEN start_date AND end_date)
//         )
//         `,
//         [existing.school_id, id, newStart, newEnd]
//       );

//       if (overlap.length) {
//         throw { status: 400, message: "Academic year overlap" };
//       }

//       fields.push("start_date=?", "end_date=?", "name=?");
//       values.push(newStart, newEnd, newName);
//     }

//     // =========================
//     // 🔴 STATUS
//     // =========================

//     if (validated.status) {
//       fields.push("status=?");
//       values.push(validated.status);
//     }

//     // =========================
//     // 🔴 CURRENT YEAR CONTROL
//     // =========================

//     if (validated.is_current !== undefined) {
//       if (validated.is_current) {
//         await AcademicYearModel.setAllNotCurrent(
//           conn,
//           existing.school_id
//         );
//       }

//       fields.push("is_current=?");
//       values.push(validated.is_current ? 1 : 0);
//     }

//     // =========================
//     // 🔴 NOTHING TO UPDATE
//     // =========================

//     if (!fields.length) {
//       throw { status: 400, message: "Nothing to update" };
//     }

//     await AcademicYearModel.update(conn, id, fields, values);

//     await conn.commit();

//     return { message: "Academic year updated" };

//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

/* ---------------- is_current auto generate --------------------------------------------------- */

export const updateAcademicYear = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateUpdateAcademicYear(data);

    await conn.beginTransaction();

    const existing = await AcademicYearModel.findById(conn, id);
    if (!existing) {
      throw { status: 404, message: "Academic year not found" };
    }

    const fields = [];
    const values = [];

    const today = new Date().toISOString().split("T")[0];

    // =========================
    // 🔴 BLOCK IF ALREADY STARTED
    // =========================
    if (existing.start_date <= today) {
      throw {
        status: 400,
        message: "Cannot modify academic year that already started",
      };
    }

    // =========================
    // 🔴 DATE UPDATE
    // =========================

    const newStart = validated.start_date || existing.start_date;
    const newEnd = validated.end_date || existing.end_date;

    if (validated.start_date || validated.end_date) {
      // ❌ No past dates
      if (newStart < today) {
        throw {
          status: 400,
          message: "Start date cannot be in the past",
        };
      }

      // ❌ invalid range
      if (new Date(newStart) >= new Date(newEnd)) {
        throw {
          status: 400,
          message: "End date must be after start date",
        };
      }

      const newName = generateAcademicYearName(newStart, newEnd);

      // ❌ duplicate
      const [[dup]] = await conn.query(
        `SELECT id FROM academic_years 
         WHERE school_id=? AND name=? AND id!=?`,
        [existing.school_id, newName, id]
      );

      if (dup) {
        throw { status: 409, message: "Academic year already exists" };
      }

      // ❌ PROPER OVERLAP CHECK (IMPORTANT FIX)
      const [overlap] = await conn.query(
        `
        SELECT id FROM academic_years
        WHERE school_id = ?
        AND id != ?
        AND (
          start_date <= ? AND end_date >= ?
        )
        `,
        [existing.school_id, id, newEnd, newStart]
      );

      if (overlap.length) {
        throw {
          status: 400,
          message: "Academic year overlaps existing one",
        };
      }

      fields.push("start_date=?", "end_date=?", "name=?");
      values.push(newStart, newEnd, newName);
    }

    // =========================
    // 🔴 STATUS
    // =========================

    if (validated.status) {
      fields.push("status=?");
      values.push(validated.status);
    }

    // =========================
    // 🔴 CURRENT YEAR CONTROL
    // =========================

    if (validated.is_current !== undefined) {
      if (validated.is_current) {
        await AcademicYearModel.setAllNotCurrent(
          conn,
          existing.school_id
        );
      }

      fields.push("is_current=?");
      values.push(validated.is_current ? 1 : 0);
    }

    // =========================
    // 🔴 NOTHING TO UPDATE
    // =========================

    if (!fields.length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await AcademicYearModel.update(conn, id, fields, values);

    await conn.commit();

    return { message: "Academic year updated" };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAcademicYears = async (school_id) => {
  const db = getDB();

  let query = `
    SELECT *
    FROM academic_years
  `;

  const values = [];

  if (school_id) {
    query += ` WHERE school_id = ?`;
    values.push(school_id);
  }

  query += ` ORDER BY start_date DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const getAcademicYearById = async (id) => {
  const db = getDB();

  const [[row]] = await db.query(
    `SELECT * FROM academic_years WHERE id = ?`,
    [id]
  );

  if (!row) {
    throw { status: 404, message: "Academic year not found" };
  }

  return row;
};

export const deleteAcademicYear = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(
      `SELECT * FROM academic_years WHERE id = ?`,
      [id]
    );

    if (!existing) {
      throw { status: 404, message: "Academic year not found" };
    }

    // ❌ prevent deleting current year
    if (existing.is_current) {
      throw {
        status: 400,
        message: "Cannot delete current academic year",
      };
    }

    // ❌ OPTIONAL (recommended)
    // block delete if used in other tables
    // example:
    // const [[used]] = await conn.query(
    //   `SELECT id FROM students WHERE academic_year_id=? LIMIT 1`,
    //   [id]
    // );
    // if (used) {
    //   throw { status: 400, message: "Year already in use" };
    // }

    await conn.query(
      `DELETE FROM academic_years WHERE id = ?`,
      [id]
    );

    await conn.commit();

    return { message: "Academic year deleted" };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
