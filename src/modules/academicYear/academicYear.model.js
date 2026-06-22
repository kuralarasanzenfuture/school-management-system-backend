export const AcademicYearModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `
      INSERT INTO academic_years
      (school_id, name, start_date, end_date, is_current, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.name,
        data.start_date,
        data.end_date,
        data.is_current,
        data.status,
      ]
    );

    return result.insertId;
  },

  findByName: async (conn, school_id, name) => {
    const [[row]] = await conn.query(
      `SELECT * FROM academic_years WHERE school_id=? AND name=?`,
      [school_id, name]
    );
    return row;
  },

  setAllNotCurrent: async (conn, school_id) => {
    await conn.query(
      `UPDATE academic_years SET is_current=0 WHERE school_id=?`,
      [school_id]
    );
  },

  update: async (conn, id, fields, values) => {
    await conn.query(
      `UPDATE academic_years SET ${fields.join(", ")} WHERE id=?`,
      [...values, id]
    );
  },

  findById: async (conn, id) => {
    const [[row]] = await conn.query(
      `SELECT * FROM academic_years WHERE id=?`,
      [id]
    );
    return row;
  },
};