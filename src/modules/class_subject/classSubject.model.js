export const create = async (conn, data) => {
  const [res] = await conn.query(
    `INSERT INTO class_subjects 
    (school_id, class_id, subject_id, subject_group_id, employee_id, academic_year_id, is_optional)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.school_id,
      data.class_id,
      data.subject_id,
      data.subject_group_id,
      data.employee_id,
      data.academic_year_id,
      data.is_optional,
    ],
  );

  return res.insertId;
};

// export const findDuplicate = async (
//   db,
//   school_id,
//   class_id,
//   subject_id,
//   academic_year_id,
//   excludeId = null,
// ) => {
//   let query = `
//     SELECT id 
//     FROM class_subjects 
//     WHERE school_id = ?
//       AND class_id = ?
//       AND subject_id = ?
//       AND academic_year_id = ?
//   `;

//   const values = [school_id, class_id, subject_id, academic_year_id];

//   if (excludeId) {
//     query += ` AND id != ?`;
//     values.push(excludeId);
//   }

//   const [[row]] = await db.query(query, values);
//   return row;
// };

export const findDuplicate = async (
  db,
  { school_id, class_id, subject_id, academic_year_id, subject_group_id },
  excludeId = null
) => {
  let query = `
    SELECT id 
    FROM class_subjects
    WHERE school_id = ?
      AND class_id = ?
      AND subject_id = ?
      AND academic_year_id = ?
  `;

  const values = [
    school_id,
    class_id,
    subject_id,
    academic_year_id
  ];

  if (subject_group_id !== undefined) {
    query += ` AND subject_group_id <=> ?`;
    values.push(subject_group_id);
  }

  if (excludeId) {
    query += ` AND id != ?`;
    values.push(excludeId);
  }

  const [[row]] = await db.query(query, values);
  return row;
};

export const findById = async (db, id) => {
  const [[row]] = await db.query(
    `
    SELECT 
      cs.id,

      cs.school_id,
      sc.name AS school_name,

      cs.class_id,
      c.name AS class_name,

      cs.subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,

      cs.subject_group_id,
      sg.name AS subject_group_name,

      cs.employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name,

      cs.academic_year_id,
      ay.name AS academic_year,

      cs.is_optional,
      cs.created_at

    FROM class_subjects cs

    JOIN schools sc 
      ON cs.school_id = sc.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN subjects sub 
      ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg 
      ON cs.subject_group_id = sg.id

    LEFT JOIN employees e 
      ON cs.employee_id = e.id

    JOIN academic_years ay 
      ON cs.academic_year_id = ay.id

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

      cs.school_id,
      sc.name AS school_name,

      cs.class_id,
      c.name AS class_name,

      cs.subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,

      cs.subject_group_id,
      sg.name AS subject_group_name,

      cs.employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name,

      cs.academic_year_id,
      ay.name AS academic_year,

      cs.is_optional,
      cs.created_at

    FROM class_subjects cs

    JOIN schools sc 
      ON cs.school_id = sc.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN subjects sub 
      ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg 
      ON cs.subject_group_id = sg.id

    LEFT JOIN employees e 
      ON cs.employee_id = e.id

    JOIN academic_years ay 
      ON cs.academic_year_id = ay.id

    ORDER BY cs.id DESC
  `);

  return rows;
};

export const getAllBySchool = async (db, school_id) => {
  let query = `
    SELECT 
      cs.id,

      cs.school_id,
      sc.name AS school_name,

      cs.class_id,
      c.name AS class_name,

      cs.subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,

      cs.subject_group_id,
      sg.name AS subject_group_name,

      cs.employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name,

      cs.academic_year_id,
      ay.name AS academic_year,

      cs.is_optional,
      cs.created_at

    FROM class_subjects cs

    JOIN schools sc 
      ON cs.school_id = sc.id

    JOIN classes c 
      ON cs.class_id = c.id

    JOIN subjects sub 
      ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg 
      ON cs.subject_group_id = sg.id

    LEFT JOIN employees e 
      ON cs.employee_id = e.id

    JOIN academic_years ay 
      ON cs.academic_year_id = ay.id

    WHERE 1=1
  `;

  const values = [];

  if (school_id) {
    query += ` AND cs.school_id = ?`;
    values.push(school_id);
  }

  query += ` ORDER BY cs.id DESC`;

  const [rows] = await db.query(query, values);

  return rows;
};

export const update = async (conn, id, data) => {
  const fields = [];
  const values = [];

  Object.keys(data).forEach((key) => {
    fields.push(`${key}=?`);
    values.push(data[key]);
  });

  await conn.query(
    `UPDATE class_subjects SET ${fields.join(", ")} WHERE id=?`,
    [...values, id],
  );
};

export const remove = async (db, id) => {
  await db.query(`DELETE FROM class_subjects WHERE id=?`, [id]);
};

export const getAllWithDetails = async (db, school_id = null) => {
  let query = `
    SELECT 
      cs.id,
      cs.is_optional,
      cs.created_at,

      sc.id AS school_id,
      sc.name AS school_name,

      c.id AS class_id,
      c.name AS class_name,

      sub.id AS subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,

      sg.id AS subject_group_id,
      sg.name AS subject_group_name,

      e.id AS employee_id,
      CONCAT(e.first_name, ' ', e.last_name) AS teacher_name,

      ay.id AS academic_year_id,
      ay.name AS academic_year

    FROM class_subjects cs

    JOIN schools sc ON cs.school_id = sc.id
    JOIN classes c ON cs.class_id = c.id
    JOIN subjects sub ON cs.subject_id = sub.id

    LEFT JOIN subject_groups sg ON cs.subject_group_id = sg.id
    LEFT JOIN employees e ON cs.employee_id = e.id

    JOIN academic_years ay ON cs.academic_year_id = ay.id
  `;

  const values = [];

  if (school_id) {
    query += ` WHERE cs.school_id = ?`;
    values.push(school_id);
  }

  query += ` ORDER BY cs.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};
