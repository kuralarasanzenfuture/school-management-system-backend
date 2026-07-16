

export const SalaryStructureModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_salary_structures
      (school_id, employee_id, structure_name, effective_from, effective_to, status, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.employee_id,
        data.structure_name,
        data.effective_from,
        data.effective_to,
        data.status,
        data.remarks,
        data.created_by,
      ],
    );

    return res.insertId;
  },

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employee_salary_structures WHERE id=?`,
      [id],
    );
    return row;
  },

  async update(conn, id, fields, values) {
    await conn.query(
      `UPDATE employee_salary_structures SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM employee_salary_structures WHERE id=?`, [id]);
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        ess.*,
        e.first_name,
        e.last_name,
        e.designation,
        sc.name AS school_name
      FROM employee_salary_structures ess
      JOIN employees e ON ess.employee_id = e.id
      JOIN schools sc ON ess.school_id = sc.id
      ORDER BY ess.id DESC
    `);

    return rows;
  },
};
