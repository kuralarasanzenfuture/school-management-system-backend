export const ComponentModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `INSERT INTO employee_salary_components
      (school_id, name, code, component_type, calculation_type, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.school_id,
        data.name,
        data.code,
        data.component_type,
        data.calculation_type,
        data.status,
      ],
    );
    return res.insertId;
  },

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employee_salary_components WHERE id=?`,
      [id],
    );
    return row;
  },

  async findDuplicate(conn, school_id, code, excludeId = null) {
    const [rows] = await conn.query(
      `SELECT id FROM employee_salary_components
       WHERE school_id=? AND code=? ${excludeId ? "AND id!=?" : ""}`,
      excludeId ? [school_id, code, excludeId] : [school_id, code],
    );
    return rows[0];
  },

  async update(conn, id, data) {
    const fields = Object.keys(data).map((k) => `${k}=?`);
    const values = Object.values(data);

    await conn.query(
      `UPDATE employee_salary_components SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM employee_salary_components WHERE id=?`, [id]);
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        esc.*,
        sc.name AS school_name
      FROM employee_salary_components esc
      JOIN schools sc ON esc.school_id = sc.id
      ORDER BY esc.id DESC
    `);
    return rows;
  },
};
