export const SalaryStructureDetailsModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_salary_structure_details
      (salary_structure_id, component_id, calculation_type, amount, percentage, based_on)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.salary_structure_id,
        data.component_id,
        data.calculation_type,
        data.amount,
        data.percentage,
        data.based_on,
      ],
    );

    return res.insertId;
  },

  async findDuplicate(conn, structureId, componentId, excludeId = null) {
    const [rows] = await conn.query(
      `
      SELECT id FROM employee_salary_structure_details
      WHERE salary_structure_id=? AND component_id=?
      ${excludeId ? "AND id != ?" : ""}
      `,
      excludeId
        ? [structureId, componentId, excludeId]
        : [structureId, componentId],
    );

    return rows[0];
  },

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employee_salary_structure_details WHERE id=?`,
      [id],
    );
    return row;
  },

  async update(conn, id, fields, values) {
    await conn.query(
      `UPDATE employee_salary_structure_details SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },

  async delete(conn, id) {
    await conn.query(
      `DELETE FROM employee_salary_structure_details WHERE id=?`,
      [id],
    );
  },

  async getAll(db) {
    const [rows] = await db.query(`
      SELECT 
        d.*,
        c.name AS component_name,
        s.structure_name
      FROM employee_salary_structure_details d
      JOIN employee_salary_components c ON d.component_id = c.id
      JOIN employee_salary_structures s ON d.salary_structure_id = s.id
      ORDER BY d.id DESC
    `);

    return rows;
  },
};
