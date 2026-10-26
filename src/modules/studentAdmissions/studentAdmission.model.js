import { getDB } from "../../config/db.js";

export const StudentAdmissionModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(`INSERT INTO student_admissions SET ?`, [
      data,
    ]);
    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();

    const query = `
      SELECT
        sa.*,

        -- Student Details
        s.student_code,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.email,
        s.mobile_no,
        s.parent_mobile,
        s.alternate_mobile,
        s.father_name,
        s.mother_name,
        s.gender,
        s.date_of_birth,
        s.photo_url,
        s.status AS student_status,

        -- School
        sch.id AS school_id,
        sch.name AS school_name,

        -- Class
        c.name AS class_name,

        -- Academic Year
        ay.name AS academic_year_name,

        -- Subject Group
        sa.subject_group_id,
        COALESCE(sa.subject_group, sg.name) AS subject_group,
        COALESCE(sg.name, sa.subject_group) AS subject_group_name,

        -- Active Section Allocation
        ssa.id AS section_allocation_id,
        ssa.class_section_id,
        sec.name AS section_name,
        sec.name AS section,
        ssa.roll_no,
        ssa.allocation_date,
        ssa.effective_to,
        ssa.status AS section_allocation_status

      FROM student_admissions sa
      INNER JOIN students s ON sa.student_id = s.id
      LEFT JOIN schools sch ON sa.school_id = sch.id
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
      LEFT JOIN subject_groups sg ON sa.subject_group_id = sg.id
      LEFT JOIN student_section_allocations ssa ON sa.id = ssa.admission_id
        AND ssa.status = 'active'
        AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)
      LEFT JOIN class_sections cs ON ssa.class_section_id = cs.id
      LEFT JOIN sections sec ON cs.section_id = sec.id
      WHERE sa.id = ?
      LIMIT 1
    `;

    const [[row]] = await db.query(query, [id]);
    return row;
  },

  countByYear: async (conn, academic_year_id) => {
    const [[row]] = await conn.query(
      `SELECT COUNT(*) as total FROM student_admissions WHERE academic_year_id=?`,
      [academic_year_id],
    );
    return row.total;
  },

  countBySchool: async (conn, school_id) => {
    const [[row]] = await conn.query(
      `SELECT COUNT(*) as total FROM student_admissions WHERE school_id=?`,
      [school_id],
    );
    return row.total;
  },

  getAll: async (filters = {}) => {
    const db = getDB();

    let query = `
      SELECT
        sa.*,

        -- Student Details
        s.student_code,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.email,
        s.mobile_no,
        s.parent_mobile,
        s.alternate_mobile,
        s.father_name,
        s.mother_name,
        s.gender,
        s.date_of_birth,
        s.photo_url,
        s.status AS student_status,

        -- School
        sch.id AS school_id,
        sch.name AS school_name,

        -- Class
        c.name AS class_name,

        -- Academic Year
        ay.name AS academic_year_name,

        -- Subject Group
        sa.subject_group_id,
        COALESCE(sa.subject_group, sg.name) AS subject_group,
        COALESCE(sg.name, sa.subject_group) AS subject_group_name,

        -- Active Section Allocation
        ssa.id AS section_allocation_id,
        ssa.class_section_id,
        sec.name AS section_name,
        sec.name AS section,
        ssa.roll_no,
        ssa.allocation_date,
        ssa.effective_to,
        ssa.status AS section_allocation_status

      FROM student_admissions sa
      INNER JOIN students s ON sa.student_id = s.id
      LEFT JOIN schools sch ON sa.school_id = sch.id
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
      LEFT JOIN subject_groups sg ON sa.subject_group_id = sg.id
      LEFT JOIN student_section_allocations ssa ON sa.id = ssa.admission_id
        AND ssa.status = 'active'
        AND (ssa.effective_to IS NULL OR ssa.effective_to >= CURRENT_DATE)
      LEFT JOIN class_sections cs ON ssa.class_section_id = cs.id
      LEFT JOIN sections sec ON cs.section_id = sec.id
      WHERE 1 = 1
    `;

    const values = [];

    if (filters.student_id) {
      query += ` AND sa.student_id = ?`;
      values.push(filters.student_id);
    }

    if (filters.class_id) {
      query += ` AND (sa.class_id = ? OR c.name = ?)`;
      values.push(filters.class_id, filters.class_id);
    }

    if (filters.class_name) {
      query += ` AND c.name = ?`;
      values.push(filters.class_name);
    }

    if (filters.academic_year_id) {
      query += ` AND (sa.academic_year_id = ? OR ay.name = ?)`;
      values.push(filters.academic_year_id, filters.academic_year_id);
    }

    if (filters.academic_year_name) {
      query += ` AND ay.name = ?`;
      values.push(filters.academic_year_name);
    }

    if (filters.school_id) {
      query += ` AND sa.school_id = ?`;
      values.push(filters.school_id);
    }

    if (filters.status) {
      query += ` AND sa.status = ?`;
      values.push(filters.status);
    }

    if (filters.admission_number) {
      query += ` AND sa.admission_number = ?`;
      values.push(filters.admission_number);
    }

    if (filters.subject_group_id) {
      query += ` AND sa.subject_group_id = ?`;
      values.push(filters.subject_group_id);
    }

    if (filters.subject_group) {
      query += ` AND (sa.subject_group = ? OR sg.name = ?)`;
      values.push(filters.subject_group, filters.subject_group);
    }

    if (filters.class_section_id) {
      query += ` AND ssa.class_section_id = ?`;
      values.push(filters.class_section_id);
    }

    if (filters.section) {
      query += ` AND sec.name = ?`;
      values.push(filters.section);
    }

    if (filters.roll_no) {
      query += ` AND ssa.roll_no = ?`;
      values.push(filters.roll_no);
    }

    if (filters.admission_type) {
      query += ` AND sa.admission_type = ?`;
      values.push(filters.admission_type);
    }

    if (filters.gender) {
      query += ` AND s.gender = ?`;
      values.push(filters.gender);
    }

    if (filters.from_date && filters.to_date) {
      query += ` AND sa.admission_date BETWEEN ? AND ?`;
      values.push(filters.from_date, filters.to_date);
    } else if (filters.from_date) {
      query += ` AND sa.admission_date >= ?`;
      values.push(filters.from_date);
    } else if (filters.to_date) {
      query += ` AND sa.admission_date <= ?`;
      values.push(filters.to_date);
    }

    query += ` ORDER BY sa.id DESC`;

    const [rows] = await db.query(query, values);
    return rows;
  },

  update: async (conn, id, data) => {
    await conn.query(`UPDATE student_admissions SET ? WHERE id=?`, [data, id]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM student_admissions WHERE id=?`, [id]);
  },
};
