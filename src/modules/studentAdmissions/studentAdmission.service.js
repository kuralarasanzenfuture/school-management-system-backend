import { getDB } from "../../config/db.js";
import { StudentAdmissionModel } from "./studentAdmission.model.js";
import {
  validateCreateAdmission,
  validateUpdateAdmission,
} from "./studentAdmission.validation.js";

const generateAdmissionNumber = async (conn, school_id) => {
  const [[row]] = await conn.query(
    `SELECT COUNT(*) as total FROM student_admissions sa
     JOIN students s ON sa.student_id = s.id
     WHERE s.school_id=?`,
    [school_id],
  );

  return `ADM-${String(row.total + 1).padStart(5, "0")}`;
};

export const createAdmission = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateAdmission(data);

    await conn.beginTransaction();

    // ✅ STUDENT CHECK
    const [[student]] = await conn.query(
      `SELECT id, school_id FROM students WHERE id=?`,
      [validated.student_id],
    );

    if (!student) {
      throw { status: 404, message: "Student not found" };
    }

    // 🔴 BLOCK DUPLICATE (CRITICAL FIX)
    const [[existing]] = await conn.query(
      `SELECT id FROM student_admissions 
       WHERE student_id=? AND academic_year_id=?`,
      [validated.student_id, validated.academic_year_id],
    );

    if (existing) {
      throw {
        status: 409,
        message: "Student already admitted for this academic year",
      };
    }

    // ✅ ACADEMIC YEAR
    const [[year]] = await conn.query(
      `SELECT id, name FROM academic_years WHERE id=?`,
      [validated.academic_year_id],
    );

    if (!year) {
      throw { status: 404, message: "Academic year not found" };
    }

    // ✅ CLASS
    const [[cls]] = await conn.query(
      `SELECT id, name FROM classes WHERE id=?`,
      [validated.class_id],
    );

    if (!cls) {
      throw { status: 404, message: "Class not found" };
    }

    // ✅ COUNT FOR ADMISSION NUMBER
    const [[countRow]] = await conn.query(
      `SELECT COUNT(*) as total FROM student_admissions 
       WHERE academic_year_id=?`,
      [validated.academic_year_id],
    );

    const admission_number = `ADM-${year.name}-${String(
      countRow.total + 1,
    ).padStart(4, "0")}`;

    // ✅ FINAL DATA
    const insertData = {
      ...validated,
      admission_number,
      admission_date: new Date(),
      academic_year: year.name,
      class_name: cls.name,
      status: "active",
    };

    const id = await StudentAdmissionModel.create(conn, insertData);

    await conn.commit();

    // 🔥 FULL RESPONSE (NOT JUST ID)
    return {
      message: "Admission created successfully",
      data: {
        id,
        student_id: validated.student_id,
        admission_number,
        admission_date: insertData.admission_date,
        academic_year_id: validated.academic_year_id,
        academic_year: year.name,
        class_id: validated.class_id,
        class_name: cls.name,
        section: validated.section,
        roll_no: validated.roll_no,
        joining_date: validated.joining_date,
        subject_group: validated.subject_group,
        transport_required: validated.transport_required,
        hostel_required: validated.hostel_required,
        admission_type: validated.admission_type,
        status: "active",
      },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateAdmission = async (id, data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    if (!id) throw { status: 400, message: "ID required" };

    const validated = validateUpdateAdmission(data);

    if (!Object.keys(validated).length) {
      throw { status: 400, message: "Nothing to update" };
    }

    await conn.beginTransaction();

    const existing = await StudentAdmissionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Admission not found" };
    }

    await StudentAdmissionModel.update(conn, id, validated);

    await conn.commit();

    return { message: "Admission updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteAdmission = async (id) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await StudentAdmissionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Not found" };
    }

    await StudentAdmissionModel.delete(conn, id);

    await conn.commit();

    return { message: "Deleted successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAdmissions = async (filters) => {
  try {
    const admissions = await StudentAdmissionModel.getAll(filters);
    return admissions;
  } catch (err) {
    throw err;
  }
};

export const getAdmissionById = async (id) => {
  try {
    const admission = await StudentAdmissionModel.findById(id);
    return admission;
  } catch (err) {
    throw err;
  }
};
