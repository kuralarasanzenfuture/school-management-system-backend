import { getDB } from "../../config/db.js";

export const SectionModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO sections (class_id, name, capacity, status)
       VALUES (?, ?, ?, ?)`,
      [data.class_id, data.name, data.capacity, data.status],
    );
    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();
    // const [[row]] = await db.query(
    //   `SELECT * FROM sections WHERE id=?`,
    //   [id]
    // );

    const [[row]] = await db.query(
      `
  SELECT 
    s.id,
    s.name AS section_name,
    s.capacity,
    s.status,

    c.id AS class_id,
    c.name AS class_name,
    c.school_id AS class_school_id,
    c.status AS class_status,
  
    CONCAT(c.name, ' - ', s.name) AS class_section

  FROM sections s
  JOIN classes c ON s.class_id = c.id

  WHERE s.id = ?
  `,
      [id],
    );

    return row;
  },

  findDuplicate: async (class_id, name, excludeId = null) => {
    const db = getDB();

    let query = `
      SELECT id FROM sections
      WHERE class_id=? AND name=?
    `;

    const params = [class_id, name];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [[row]] = await db.query(query, params);
    return row;
  },

  //   getAll: async () => {
  //     const db = getDB();

  //     const [rows] = await db.query(`
  //     SELECT
  //       s.id,
  //       s.name AS section_name,
  //       s.capacity,
  //       s.status,
  //       s.created_at,

  //       c.id AS class_id,
  //       c.name AS class_name,
  //       c.status AS class_status,

  //       sc.id AS school_id,
  //       sc.name AS school_name,

  //       CONCAT(c.name, '-', s.name) AS class_section

  //     FROM sections s
  //     JOIN classes c ON s.class_id = c.id
  //     JOIN schools sc ON c.school_id = sc.id

  //     ORDER BY c.name, s.name
  //   `);

  //     return rows;
  //   },

//   getAll: async ({ class_id, school_id }) => {
  getAll: async ({ class_id, school_id } = {}) => {
    const db = getDB();

    let query = `
    SELECT 
      s.id,
      s.name AS section_name,
      s.capacity,
      s.status,

      c.id AS class_id,
      c.name AS class_name,

      sc.id AS school_id,
      sc.name AS school_name,

      CONCAT(c.name, '-', s.name) AS class_section

    FROM sections s
    JOIN classes c ON s.class_id = c.id
    JOIN schools sc ON c.school_id = sc.id
    WHERE 1=1
  `;

    const values = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      values.push(class_id);
    }

    if (school_id) {
      query += ` AND sc.id = ?`;
      values.push(school_id);
    }

    query += ` ORDER BY c.name, s.name`;

    const [rows] = await db.query(query, values);
    return rows;
  },

  getAllTreeData: async () => {
  const db = getDB();

  const [rows] = await db.query(`
    SELECT 
      sc.id AS school_id,
      sc.name AS school_name,

      c.id AS class_id,
      c.name AS class_name,

      s.id AS section_id,
      s.name AS section_name

    FROM schools sc
    LEFT JOIN classes c ON c.school_id = sc.id
    LEFT JOIN sections s ON s.class_id = c.id

    ORDER BY sc.id, c.id, s.id
  `);

  return rows;
},

  getAllClassById: async (class_id) => {
    const db = getDB();
    // const [rows] = await db.query(
    //   `SELECT * FROM sections WHERE class_id=? ORDER BY name`,
    //   [class_id],
    // );

    const [rows] = await db.query(
      `
    SELECT 
      s.id,
      s.name AS section_name,
      s.capacity,
      s.status,

      c.id AS class_id,
      c.name AS class_name,

      CONCAT(c.name, '-', s.name) AS class_section

    FROM sections s
    JOIN classes c ON s.class_id = c.id

    WHERE s.class_id = ?
    ORDER BY s.name
    `,
      [class_id],
    );

    return rows;
  },

  update: async (conn, id, fields, values) => {
    const query = `UPDATE sections SET ${fields.join(", ")} WHERE id=?`;
    await conn.query(query, [...values, id]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM sections WHERE id=?`, [id]);
  },
};
