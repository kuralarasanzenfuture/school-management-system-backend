

export const EmployeeAttendanceModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_attendance
      (school_id, employee_id, attendance_date, status, shift_id, check_in, check_out,
       total_work_minutes, overtime_minutes, late_minutes, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.employee_id,
        data.attendance_date,
        data.status,
        data.shift_id,
        data.check_in,
        data.check_out,
        data.total_work_minutes,
        data.overtime_minutes,
        data.late_minutes,
        data.remarks,
      ],
    );

    return res.insertId;
  },

  async findExisting(conn, employee_id, date) {
    const [[row]] = await conn.query(
      `SELECT id FROM employee_attendance 
       WHERE employee_id=? AND attendance_date=?`,
      [employee_id, date],
    );
    return row;
  },

  async update(conn, id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    await conn.query(
      `UPDATE employee_attendance SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  async delete(conn, id) {
    await conn.query(`DELETE FROM employee_attendance WHERE id = ?`, [id]);
  },
};
