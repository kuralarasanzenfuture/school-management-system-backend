export const EmployeeAttendanceModel = {
  async create(conn, data) {
    const [res] = await conn.query(
      `
      INSERT INTO employee_attendance
      (school_id, employee_id, attendance_date, status, shift_id, check_in, check_out,
       total_work_minutes, overtime_minutes, late_minutes, remarks, marked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.school_id,
        data.employee_id,
        data.attendance_date,
        data.status,
        data.shift_id ?? null,
        data.check_in ?? null,
        data.check_out ?? null,
        data.total_work_minutes ?? 0,
        data.overtime_minutes ?? 0,
        data.late_minutes ?? 0,
        data.remarks ?? null,
        data.marked_by ?? null,
      ],
    );

    return res.insertId;
  },

  async findExisting(conn, employee_id, date) {
    const [[row]] = await conn.query(
      `SELECT * FROM employee_attendance 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employee_id, date],
    );
    return row;
  },

  async findById(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employee_attendance WHERE id = ?`,
      [id],
    );
    return row;
  },

  async update(conn, id, data) {
    const ALLOWED_UPDATE_FIELDS = [
      "school_id",
      "employee_id",
      "attendance_date",
      "status",
      "shift_id",
      "check_in",
      "check_out",
      "total_work_minutes",
      "overtime_minutes",
      "late_minutes",
      "remarks",
      "marked_by",
    ];

    const fields = [];
    const values = [];

    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return { affectedRows: 0 };

    values.push(id);
    const [result] = await conn.query(
      `UPDATE employee_attendance SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    return result;
  },

  async delete(conn, id) {
    const [result] = await conn.query(
      `DELETE FROM employee_attendance WHERE id = ?`,
      [id],
    );
    return result;
  },
};
