// classSubject.model.js
export const create = async (conn, data) => {
  const [res] = await conn.query(
    `
    INSERT INTO class_subjects
    (class_section_id, subject_id, subject_group_id, employee_id, is_optional, weekly_periods)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      data.class_section_id,
      data.subject_id,
      data.subject_group_id,
      data.employee_id,
      data.is_optional,
      data.weekly_periods,
    ],
  );

  return res.insertId;
};

export const findDuplicate = async (
  conn,
  class_section_id,
  subject_id,
  excludeId = null,
) => {
  let query = `
    SELECT id FROM class_subjects
    WHERE class_section_id = ? AND subject_id = ?
  `;

  const values = [class_section_id, subject_id];

  if (excludeId) {
    query += ` AND id != ?`;
    values.push(excludeId);
  }

  const [[row]] = await conn.query(query, values);
  return row;
};

export const findById = async (db, id) => {
  const [[row]] = await db.query(
    `
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

      -- 🔗 DISPLAY
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

    -- 🔥 CORE RELATIONS
    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id

    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id

    JOIN subjects sub ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id

    WHERE cs.id = ?
    `,
    [id],
  );

  return row;
};

export const getAll = async (db) => {
  const [rows] = await db.query(`
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

      -- 🔗 CLASS SECTION DISPLAY
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

    -- 🔗 CLASS SECTION CORE
    JOIN class_sections csec ON cs.class_section_id = csec.id

    -- 🏫 SCHOOL + YEAR
    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id

    -- 🎓 CLASS + SECTION
    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id

    -- 📘 SUBJECT
    JOIN subjects sub ON cs.subject_id = sub.id

    -- 📦 OPTIONAL JOINS
    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id

    ORDER BY cs.id DESC
  `);

  return rows;
};

export const update = async (conn, id, fields, values) => {
  await conn.query(
    `UPDATE class_subjects SET ${fields.join(", ")} WHERE id=?`,
    [...values, id],
  );
};

export const remove = async (conn, id) => {
  await conn.query(`DELETE FROM class_subjects WHERE id=?`, [id]);
};

export const getAllDetailed = async (db, school_id = null) => {
  let query = `
    SELECT 
      cs.*,

      sc.id AS school_id,
      sc.name AS school_name,

      c.id AS class_id,
      c.name AS class_name,

      s.id AS section_id,
      s.name AS section_name,

      CONCAT(c.name, '-', s.name) AS class_section_name,

      ay.id AS academic_year_id,
      ay.name AS academic_year_name,

      sub.name AS subject_name,
      sub.code AS subject_code,

      sg.name AS subject_group_name,

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

  if (school_id) {
    query += ` AND sc.id = ?`;
    values.push(school_id);
  }

  query += ` ORDER BY cs.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};
