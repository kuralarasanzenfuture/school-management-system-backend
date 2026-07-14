export const Model = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_leave_types
      (school_id, name, code, description, days_per_year,
       max_days_per_request, is_paid, carry_forward,
       max_carry_forward_days, allow_half_day,
       requires_approval, requires_attachment,
       applicable_gender, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.name,
        data.code,
        data.description,
        data.days_per_year,
        data.max_days_per_request,
        data.is_paid,
        data.carry_forward,
        data.max_carry_forward_days,
        data.allow_half_day,
        data.requires_approval,
        data.requires_attachment,
        data.applicable_gender,
        data.status,
      ],
    );

    return res.insertId;
  },

  async findDuplicate(conn, school_id, code, excludeId = null) {
    const [rows] = await conn.query(
      `SELECT id FROM employee_leave_types 
       WHERE school_id=? AND code=? ${excludeId ? "AND id!=?" : ""}`,
      excludeId ? [school_id, code, excludeId] : [school_id, code],
    );

    return rows[0];
  },

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employee_leave_types WHERE id=?`,
      [id],
    );
    return row;
  },

  async update(conn, id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach((k) => {
      fields.push(`${k}=?`);
      values.push(data[k]);
    });

    await conn.query(
      `UPDATE employee_leave_types SET ${fields.join(", ")} WHERE id=?`,
      [...values, id],
    );
  },
};
