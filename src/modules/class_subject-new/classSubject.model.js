// classSubject.model.js
export const create = async (conn, data) => {
  const [res] = await conn.query(
    `
    INSERT INTO class_subjects
    (class_section_id, subject_id, subject_group_id, employee_id, is_optional, weekly_periods, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.class_section_id,
      data.subject_id,
      data.subject_group_id || null,
      data.employee_id || null,
      data.is_optional,
      data.weekly_periods || 0,
      data.created_by || null,
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
  return row || null;
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
      cs.created_by,
      cs.updated_by,
      cs.created_at,
      cs.updated_at,

      -- SCHOOL
      sc.id AS school_id,
      sc.name AS school_name,

      -- CLASS
      c.id AS class_id,
      c.name AS class_name,

      -- SECTION
      s.id AS section_id,
      s.name AS section_name,

      -- DISPLAY
      CONCAT(c.name, '-', s.name) AS class_section_name,

      -- ACADEMIC YEAR
      ay.id AS academic_year_id,
      ay.name AS academic_year_name,

      -- SUBJECT
      sub.id AS subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,
      sub.subject_type,

      -- SUBJECT GROUP
      sg.id AS subject_group_id,
      sg.name AS subject_group_name,

      -- TEACHER
      e.id AS employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name,

      -- USER TRACKING
      u1.username AS created_by_name,
      u2.username AS updated_by_name

    FROM class_subjects cs

    JOIN class_sections csec ON cs.class_section_id = csec.id
    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id
    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id
    JOIN subjects sub ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id
    LEFT JOIN users u1 ON cs.created_by = u1.id
    LEFT JOIN users u2 ON cs.updated_by = u2.id

    WHERE cs.id = ?
    `,
    [id],
  );

  return row || null;
};

export const getAll = async (db) => {
  return await findAll(db, { paginate: false });
};

export const findAll = async (db, filters = {}) => {
  const {
    school_id,
    academic_year_id,
    class_id,
    section_id,
    class_section_id,
    subject_id,
    subject_group_id,
    employee_id,
    is_optional,
    subject_type,
    search,
    page = 1,
    limit = 20,
    sortBy = "id",
    sortOrder = "DESC",
    paginate = true,
  } = filters;

  const conditions = [];
  const params = [];

  if (school_id) {
    conditions.push("csec.school_id = ?");
    params.push(school_id);
  }

  if (academic_year_id) {
    conditions.push("csec.academic_year_id = ?");
    params.push(academic_year_id);
  }

  if (class_id) {
    conditions.push("csec.class_id = ?");
    params.push(class_id);
  }

  if (section_id) {
    conditions.push("csec.section_id = ?");
    params.push(section_id);
  }

  if (class_section_id) {
    conditions.push("cs.class_section_id = ?");
    params.push(class_section_id);
  }

  if (subject_id) {
    conditions.push("cs.subject_id = ?");
    params.push(subject_id);
  }

  if (subject_group_id !== null && subject_group_id !== undefined) {
    if (subject_group_id === "none") {
      conditions.push("cs.subject_group_id IS NULL");
    } else {
      conditions.push("cs.subject_group_id = ?");
      params.push(subject_group_id);
    }
  }

  if (employee_id !== null && employee_id !== undefined) {
    if (employee_id === "unassigned") {
      conditions.push("cs.employee_id IS NULL");
    } else {
      conditions.push("cs.employee_id = ?");
      params.push(employee_id);
    }
  }

  if (is_optional !== null && is_optional !== undefined) {
    conditions.push("cs.is_optional = ?");
    params.push(is_optional ? 1 : 0);
  }

  if (subject_type) {
    conditions.push("sub.subject_type = ?");
    params.push(subject_type);
  }

  if (search) {
    conditions.push(`(
      sub.name LIKE ? OR 
      sub.code LIKE ? OR 
      c.name LIKE ? OR 
      s.name LIKE ? OR 
      CONCAT(c.name, '-', s.name) LIKE ? OR 
      CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR 
      sg.name LIKE ? OR 
      sc.name LIKE ?
    )`);
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term, term, term);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const allowedSortCols = {
    id: "cs.id",
    school_name: "sc.name",
    class_name: "c.name",
    section_name: "s.name",
    class_section_name: "c.name",
    subject_name: "sub.name",
    subject_code: "sub.code",
    subject_type: "sub.subject_type",
    subject_group_name: "sg.name",
    teacher_name: "e.first_name",
    is_optional: "cs.is_optional",
    weekly_periods: "cs.weekly_periods",
    created_at: "cs.created_at",
    updated_at: "cs.updated_at",
  };
  const sortCol = allowedSortCols[sortBy] || "cs.id";
  const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

  const countSql = `
    SELECT COUNT(*) as total
    FROM class_subjects cs
    JOIN class_sections csec ON cs.class_section_id = csec.id
    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id
    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id
    JOIN subjects sub ON cs.subject_id = sub.id
    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id
    ${whereClause}
  `;
  const [[countResult]] = await db.query(countSql, params);
  const total = Number(countResult?.total) || 0;

  let sql = `
    SELECT 
      cs.id,
      cs.class_section_id,
      cs.subject_id,
      cs.subject_group_id,
      cs.employee_id,
      cs.is_optional,
      cs.weekly_periods,
      cs.created_by,
      cs.updated_by,
      cs.created_at,
      cs.updated_at,

      -- SCHOOL
      sc.id AS school_id,
      sc.name AS school_name,

      -- CLASS
      c.id AS class_id,
      c.name AS class_name,

      -- SECTION
      s.id AS section_id,
      s.name AS section_name,

      -- CLASS SECTION DISPLAY
      CONCAT(c.name, '-', s.name) AS class_section_name,

      -- ACADEMIC YEAR
      ay.id AS academic_year_id,
      ay.name AS academic_year_name,

      -- SUBJECT
      sub.id AS subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,
      sub.subject_type,

      -- SUBJECT GROUP
      sg.id AS subject_group_id,
      sg.name AS subject_group_name,

      -- TEACHER
      e.id AS employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name,

      -- USER TRACKING
      u1.username AS created_by_name,
      u2.username AS updated_by_name

    FROM class_subjects cs

    JOIN class_sections csec ON cs.class_section_id = csec.id
    JOIN schools sc ON csec.school_id = sc.id
    JOIN academic_years ay ON csec.academic_year_id = ay.id
    JOIN classes c ON csec.class_id = c.id
    JOIN sections s ON csec.section_id = s.id
    JOIN subjects sub ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id
    LEFT JOIN users u1 ON cs.created_by = u1.id
    LEFT JOIN users u2 ON cs.updated_by = u2.id

    ${whereClause}
    ORDER BY ${sortCol} ${sortDir}
  `;

  const queryParams = [...params];

  if (paginate) {
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
  }

  const [rows] = await db.query(sql, queryParams);

  return {
    classSubjects: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
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
  const filters = { paginate: false };
  if (school_id) filters.school_id = school_id;
  const result = await findAll(db, filters);
  return result.classSubjects;
};
