import { getDB } from "../../config/db.js";

export const StudentSectionAllocationModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO student_section_allocations SET ?`,
      [data],
    );
    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();

    const query = `
      SELECT
        ssa.*,

        -- Admission Details
        sa.school_id,
        sa.admission_number,
        sa.admission_date,
        sa.status AS admission_status,

        -- Student Details
        s.id AS student_id,
        s.student_code,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.gender,
        s.date_of_birth,
        s.photo_url,

        -- School Details
        sch.name AS school_name,

        -- Class Details
        c.id AS class_id,
        c.name AS class_name,

        -- Section Details
        sec.id AS section_id,
        sec.name AS section_name,

        -- Academic Year Details
        ay.id AS academic_year_id,
        ay.name AS academic_year_name

      FROM student_section_allocations ssa
      INNER JOIN student_admissions sa ON ssa.admission_id = sa.id
      INNER JOIN students s ON sa.student_id = s.id
      INNER JOIN class_sections cs ON ssa.class_section_id = cs.id
      INNER JOIN classes c ON cs.class_id = c.id
      INNER JOIN sections sec ON cs.section_id = sec.id
      INNER JOIN academic_years ay ON cs.academic_year_id = ay.id
      LEFT JOIN schools sch ON sa.school_id = sch.id
      WHERE ssa.id = ?
      LIMIT 1
    `;

    const [[row]] = await db.query(query, [id]);
    return row;
  },

  getAll: async (filters = {}) => {
    const db = getDB();

    let query = `
      SELECT
        ssa.*,

        -- Admission Details
        sa.school_id,
        sa.admission_number,
        sa.admission_date,
        sa.status AS admission_status,

        -- Student Details
        s.id AS student_id,
        s.student_code,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.gender,
        s.date_of_birth,
        s.photo_url,

        -- School Details
        sch.name AS school_name,

        -- Class Details
        c.id AS class_id,
        c.name AS class_name,

        -- Section Details
        sec.id AS section_id,
        sec.name AS section_name,

        -- Academic Year Details
        ay.id AS academic_year_id,
        ay.name AS academic_year_name

      FROM student_section_allocations ssa
      INNER JOIN student_admissions sa ON ssa.admission_id = sa.id
      INNER JOIN students s ON sa.student_id = s.id
      INNER JOIN class_sections cs ON ssa.class_section_id = cs.id
      INNER JOIN classes c ON cs.class_id = c.id
      INNER JOIN sections sec ON cs.section_id = sec.id
      INNER JOIN academic_years ay ON cs.academic_year_id = ay.id
      LEFT JOIN schools sch ON sa.school_id = sch.id
      WHERE 1 = 1
    `;

    const values = [];

    if (filters.admission_id) {
      query += ` AND ssa.admission_id = ?`;
      values.push(filters.admission_id);
    }

    if (filters.student_id) {
      query += ` AND sa.student_id = ?`;
      values.push(filters.student_id);
    }

    if (filters.class_section_id) {
      query += ` AND ssa.class_section_id = ?`;
      values.push(filters.class_section_id);
    }

    if (filters.class_id) {
      if (isNaN(Number(filters.class_id))) {
        query += ' AND c.name = ?';
        values.push(filters.class_id);
      } else {
        query += ' AND (cs.class_id = ? OR c.name = (SELECT name FROM classes WHERE id = ? LIMIT 1))';
        values.push(filters.class_id, filters.class_id);
      }
    }

    if (filters.section_id) {
      if (isNaN(Number(filters.section_id))) {
        query += ' AND sec.name = ?';
        values.push(filters.section_id);
      } else {
        query += ' AND (cs.section_id = ? OR sec.name = (SELECT name FROM sections WHERE id = ? LIMIT 1))';
        values.push(filters.section_id, filters.section_id);
      }
    }

    if (filters.academic_year_id) {
      if (isNaN(Number(filters.academic_year_id))) {
        query += ` AND ay.name = ?`;
        values.push(filters.academic_year_id);
      } else {
        query += ` AND (cs.academic_year_id = ? OR ay.name = (SELECT name FROM academic_years WHERE id = ? LIMIT 1))`;
        values.push(filters.academic_year_id, filters.academic_year_id);
      }
    }

    if (filters.school_id) {
      query += ` AND sa.school_id = ?`;
      values.push(filters.school_id);
    }

    if (filters.status) {
      query += ` AND ssa.status = ?`;
      values.push(filters.status);
    }

    if (filters.active_only === "true" || filters.active_only === true) {
      query += ` AND ssa.status = 'active' AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)`;
    }

    if (filters.roll_no) {
      query += ` AND ssa.roll_no = ?`;
      values.push(filters.roll_no);
    }

    if (filters.gender) {
      query += ` AND s.gender = ?`;
      values.push(filters.gender);
    }

    if (filters.allocation_date) {
      query += ` AND ssa.allocation_date = ?`;
      values.push(filters.allocation_date);
    }

    if (filters.search) {
      query += ` AND (
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        s.student_code LIKE ? OR 
        sa.admission_number LIKE ? OR 
        ssa.roll_no LIKE ?
      )`;
      const searchPattern = `%${filters.search}%`;
      values.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (filters.sort_order === "date_desc" || filters.admission_id || filters.student_id) {
      query += ` ORDER BY ssa.allocation_date DESC, ssa.id DESC`;
    } else {
      query += ` ORDER BY s.first_name ASC, s.last_name ASC, sa.id ASC`;
    }

    const [rows] = await db.query(query, values);
    return rows;
  },

  update: async (conn, id, data) => {
    await conn.query(`UPDATE student_section_allocations SET ? WHERE id = ?`, [
      data,
      id,
    ]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM student_section_allocations WHERE id = ?`, [
      id,
    ]);
  },

  getClassStudentsForAllocation: async (filters = {}) => {
    const db = getDB();

    let query = `
      SELECT 
        sa.id AS admission_id,
        sa.admission_number,
        sa.admission_date,
        sa.status AS admission_status,
        sa.school_id,
        sch.name AS school_name,
        
        -- Student Details
        s.id AS student_id,
        s.student_code,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.gender,
        s.date_of_birth,
        s.photo_url,
        
        -- Class Details
        c.id AS class_id,
        c.name AS class_name,
        
        -- Academic Year Details
        ay.id AS academic_year_id,
        ay.name AS academic_year_name,

        -- Current Active Allocation (if any)
        ssa.id AS current_allocation_id,
        ssa.class_section_id AS current_class_section_id,
        ssa.roll_no AS current_roll_no,
        ssa.allocation_date AS current_allocation_date,
        ssa.status AS current_allocation_status,
        sec.id AS current_section_id,
        sec.name AS current_section_name

      FROM student_admissions sa
      INNER JOIN students s ON sa.student_id = s.id
      INNER JOIN classes c ON sa.class_id = c.id
      INNER JOIN academic_years ay ON sa.academic_year_id = ay.id
      LEFT JOIN schools sch ON sa.school_id = sch.id
      LEFT JOIN student_section_allocations ssa 
        ON ssa.admission_id = sa.id 
        AND ssa.status = 'active' 
        AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)
      LEFT JOIN class_sections cs ON ssa.class_section_id = cs.id
      LEFT JOIN sections sec ON cs.section_id = sec.id
      WHERE sa.status = 'active'
    `;

    const values = [];

    if (filters.school_id) {
      query += ` AND sa.school_id = ?`;
      values.push(filters.school_id);
    }

    if (filters.class_id) {
      if (isNaN(Number(filters.class_id))) {
        query += ` AND c.name = ?`;
        values.push(filters.class_id);
      } else {
        query += ` AND (c.id = ? OR c.name = (SELECT name FROM classes WHERE id = ? LIMIT 1))`;
        values.push(filters.class_id, filters.class_id);
      }
    }

    if (filters.academic_year_id) {
      if (isNaN(Number(filters.academic_year_id))) {
        query += ` AND ay.name = ?`;
        values.push(filters.academic_year_id);
      } else {
        query += ` AND (ay.id = ? OR ay.name = (SELECT name FROM academic_years WHERE id = ? LIMIT 1))`;
        values.push(filters.academic_year_id, filters.academic_year_id);
      }
    }

    if (filters.section_id) {
      if (isNaN(Number(filters.section_id))) {
        query += ` AND sec.name = ?`;
        values.push(filters.section_id);
      } else {
        query += ` AND (sec.id = ? OR sec.name = (SELECT name FROM sections WHERE id = ? LIMIT 1))`;
        values.push(filters.section_id, filters.section_id);
      }
    }

    if (filters.status === "unallocated") {
      query += ` AND ssa.id IS NULL`;
    } else if (filters.status === "allocated") {
      query += ` AND ssa.id IS NOT NULL`;
    }

    if (filters.search) {
      query += ` AND (
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        s.student_code LIKE ? OR 
        sa.admission_number LIKE ? OR 
        ssa.roll_no LIKE ?
      )`;
      const searchPattern = `%${filters.search}%`;
      values.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    query += ` ORDER BY s.first_name ASC, s.last_name ASC, sa.id ASC`;

    const [rows] = await db.query(query, values);
    return rows;
  },

};
