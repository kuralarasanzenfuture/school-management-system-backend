import { getDB } from "../../config/db.js";
import { validateManualAttendance } from "./employeeAttendance.validation.js";
import { EmployeeAttendanceModel as Model } from "./employeeAttendance.model.js";

// export const markManualAttendance = async (data) => {
//   const db = getDB();
//   const conn = await db.getConnection();

//   try {
//     const validated = validateManualAttendance(data);

//     await conn.beginTransaction();

//     // 🔴 Check duplicate
//     const exists = await Model.findExisting(
//       conn,
//       validated.employee_id,
//       validated.attendance_date,
//     );

//     if (exists) {
//       throw { status: 409, message: "Attendance already marked" };
//     }

//     let total_work_minutes = 0;
//     let late_minutes = 0;
//     let overtime_minutes = 0;

//     // 🔥 Calculate only if times present
//     if (validated.check_in && validated.check_out) {
//       const inTime = new Date(validated.check_in);
//       const outTime = new Date(validated.check_out);

//       total_work_minutes = Math.floor((outTime - inTime) / 60000);

//       // 🔥 Fetch shift (if exists)
//       if (validated.shift_id) {
//         const [[shift]] = await conn.query(
//           `SELECT start_time, working_hours, grace_minutes
//            FROM employee_shifts WHERE id=?`,
//           [validated.shift_id],
//         );

//         if (shift) {
//           const shiftStart = new Date(
//             `${validated.attendance_date} ${shift.start_time}`,
//           );

//           const diffLate = Math.floor((inTime - shiftStart) / 60000);

//           if (diffLate > shift.grace_minutes) {
//             late_minutes = diffLate;
//           }

//           const expectedMinutes = shift.working_hours * 60;

//           if (total_work_minutes > expectedMinutes) {
//             overtime_minutes = total_work_minutes - expectedMinutes;
//           }
//         }
//       }
//     }

//     const id = await Model.create(conn, {
//       ...validated,
//       total_work_minutes,
//       overtime_minutes,
//       late_minutes,
//     });

//     await conn.commit();

//     return { message: "Attendance marked", id };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

export const markManualAttendance = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateManualAttendance(data);

    await conn.beginTransaction();

    // 🔥 1. Check employee + get school_id
    const [[employee]] = await conn.query(
      `SELECT id, school_id FROM employees WHERE id=?`,
      [validated.employee_id],
    );

    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    const school_id = employee.school_id;

    // 🔥 2. Duplicate check
    const exists = await Model.findExisting(
      conn,
      validated.employee_id,
      validated.attendance_date,
    );

    if (exists) {
      throw { status: 409, message: "Attendance already marked" };
    }

    let total_work_minutes = 0;
    let late_minutes = 0;
    let overtime_minutes = 0;

    // 🔥 3. Validate time logic
    if (validated.check_in && validated.check_out) {
      let inTime = new Date(validated.check_in);
      let outTime = new Date(validated.check_out);

      // 🔴 Handle cross-midnight
      if (outTime < inTime) {
        outTime.setDate(outTime.getDate() + 1);
      }

      total_work_minutes = Math.floor((outTime - inTime) / 60000);

      if (total_work_minutes <= 0) {
        throw { status: 400, message: "Invalid working time" };
      }

      // 🔥 4. Shift logic
      if (validated.shift_id) {
        const [[shift]] = await conn.query(
          `SELECT start_time, working_hours, grace_minutes, crosses_midnight, school_id 
           FROM employee_shifts WHERE id=?`,
          [validated.shift_id],
        );

        if (!shift) {
          throw { status: 404, message: "Shift not found" };
        }

        // 🔴 Ensure shift belongs to same school
        if (shift.school_id !== school_id) {
          throw {
            status: 400,
            message: "Shift does not belong to employee school",
          };
        }

        let shiftStart = new Date(
          `${validated.attendance_date} ${shift.start_time}`,
        );

        if (shift.crosses_midnight) {
          // night shift start stays same
        }

        const diffLate = Math.floor((inTime - shiftStart) / 60000);

        if (diffLate > shift.grace_minutes) {
          late_minutes = diffLate;
        }

        const expectedMinutes = Number(shift.working_hours) * 60;

        if (total_work_minutes > expectedMinutes) {
          overtime_minutes = total_work_minutes - expectedMinutes;
        }
      }
    }

    // 🔥 5. Status validation with time
    if (["absent", "holiday", "week_off", "leave"].includes(validated.status)) {
      if (validated.check_in || validated.check_out) {
        throw {
          status: 400,
          message: "Time not allowed for this status",
        };
      }
    }

    // 🔥 6. Insert
    const id = await Model.create(conn, {
      ...validated,
      school_id,
      total_work_minutes,
      overtime_minutes,
      late_minutes,
    });

    await conn.commit();

    return {
      message: "Attendance marked successfully",
      id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getAllAttendance = async (filters = {}) => {
  const db = getDB();

  let query = `
    SELECT 
      ea.*,

      e.first_name,
      e.last_name,

      es.name AS shift_name,

      sc.name AS school_name

    FROM employee_attendance ea

    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id

    WHERE 1=1
  `;

  const values = [];

  if (filters.status) {
    query += ` AND ea.status = ?`;
    values.push(filters.status);
  }

  if (filters.school_id) {
    query += ` AND ea.school_id = ?`;
    values.push(filters.school_id);
  }

  query += ` ORDER BY ea.attendance_date DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const getAllAttendanceByToken = async (user, filters = {}) => {
  const db = getDB();

  if (!user) throw { status: 401, message: "Unauthorized" };

  const isAdmin = user.roles?.some((r) => r === "ADMIN" || r.name === "ADMIN");

  let query = `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      es.name AS shift_name,
      sc.name AS school_name

    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id

    WHERE 1=1
  `;

  const values = [];

  if (!isAdmin) {
    if (!user.school_id) {
      throw { status: 400, message: "No school assigned" };
    }

    query += ` AND ea.school_id = ?`;
    values.push(user.school_id);
  }

  if (filters.status) {
    query += ` AND ea.status = ?`;
    values.push(filters.status);
  }

  query += ` ORDER BY ea.attendance_date DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const getAttendanceById = async (id) => {
  const db = getDB();

  const [[row]] = await db.query(
    `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      es.name AS shift_name

    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id

    WHERE ea.id = ?
    `,
    [id],
  );

  if (!row) throw { status: 404, message: "Attendance not found" };

  return row;
};

// export const getAttendanceByEmployee = async (employee_id, filters = {}) => {
//   const db = getDB();

//   const { month, year, from_date, to_date, status } = filters;

//   let query = `
//     SELECT
//       id,
//       school_id,
//       employee_id,
//       attendance_date,
//       status,
//       shift_id,
//       check_in,
//       check_out,
//       total_work_minutes,
//       overtime_minutes,
//       late_minutes,
//       remarks,
//       marked_by,
//       created_at,
//       updated_at
//     FROM employee_attendance
//     WHERE employee_id = ?
//   `;

//   const params = [employee_id];

//   if (year) {
//     query += ` AND YEAR(attendance_date) = ?`;
//     params.push(Number(year));
//   }

//   if (month) {
//     query += ` AND MONTH(attendance_date) = ?`;
//     params.push(Number(month));
//   }

//   if (from_date) {
//     query += ` AND attendance_date >= ?`;
//     params.push(from_date);
//   }

//   if (to_date) {
//     query += ` AND attendance_date <= ?`;
//     params.push(to_date);
//   }

//   if (status) {
//     query += ` AND status = ?`;
//     params.push(status);
//   }

//   query += ` ORDER BY attendance_date DESC`;

//   const [rows] = await db.query(query, params);

//   return rows;
// };

export const getAttendanceByEmployee = async (employee_id, filters = {}) => {
  const db = getDB();

  const {
    month,
    year,
    from_date,
    to_date,
    status,
    shift_id,
    marked_by,
    late_only,
    overtime_only,
  } = filters;

  let where = ` WHERE employee_id = ? `;
  const params = [employee_id];

  if (year) {
    where += ` AND YEAR(attendance_date) = ?`;
    params.push(Number(year));
  }

  if (month) {
    where += ` AND MONTH(attendance_date) = ?`;
    params.push(Number(month));
  }

  if (from_date) {
    where += ` AND attendance_date >= ?`;
    params.push(from_date);
  }

  if (to_date) {
    where += ` AND attendance_date <= ?`;
    params.push(to_date);
  }

  if (status) {
    where += ` AND status = ?`;
    params.push(status);
  }

  if (shift_id) {
    where += ` AND shift_id = ?`;
    params.push(Number(shift_id));
  }

  if (marked_by) {
    where += ` AND marked_by = ?`;
    params.push(Number(marked_by));
  }

  if (late_only === "true") {
    where += ` AND late_minutes > 0`;
  }

  if (overtime_only === "true") {
    where += ` AND overtime_minutes > 0`;
  }

  // Attendance Logs
  const [logs] = await db.query(
    `
    SELECT
      id,
      school_id,
      employee_id,
      attendance_date,
      status,
      shift_id,
      check_in,
      check_out,
      total_work_minutes,
      overtime_minutes,
      late_minutes,
      remarks,
      marked_by,
      created_at,
      updated_at
    FROM employee_attendance
    ${where}
    ORDER BY attendance_date DESC
    `,
    params,
  );

  // Summary
  const [summary] = await db.query(
    `
    SELECT
      COUNT(*) AS total_records,

      SUM(status='present')  AS present_days,
      SUM(status='absent')   AS absent_days,
      SUM(status='late')     AS late_days,
      SUM(status='half_day') AS half_days,
      SUM(status='leave')    AS leave_days,
      SUM(status='holiday')  AS holiday_days,
      SUM(status='week_off') AS week_off_days,

      SUM(total_work_minutes) AS total_work_minutes,
      SUM(overtime_minutes)   AS total_overtime_minutes,
      SUM(late_minutes)       AS total_late_minutes,

      ROUND(SUM(total_work_minutes)/60,2) AS total_work_hours,
      ROUND(SUM(overtime_minutes)/60,2)   AS total_overtime_hours,

      MIN(attendance_date) AS first_attendance,
      MAX(attendance_date) AS last_attendance
    FROM employee_attendance
    ${where}
    `,
    params,
  );

  return {
    filters: {
      employee_id: Number(employee_id),
      month: month || null,
      year: year || null,
      from_date: from_date || null,
      to_date: to_date || null,
      status: status || null,
      shift_id: shift_id || null,
      marked_by: marked_by || null,
      late_only: late_only === "true",
      overtime_only: overtime_only === "true",
    },

    summary: summary[0],

    logs,
  };
};

export const getAttendanceByDateRange = async (queryParams) => {
  const db = getDB();

  const { start_date, end_date, employee_id } = queryParams;

  if (!start_date || !end_date) {
    throw { status: 400, message: "start_date & end_date required" };
  }

  let query = `
    SELECT * FROM employee_attendance
    WHERE attendance_date BETWEEN ? AND ?
  `;

  const values = [start_date, end_date];

  if (employee_id) {
    query += ` AND employee_id = ?`;
    values.push(employee_id);
  }

  query += ` ORDER BY attendance_date DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const updateAttendance = async (id, data) => {
  const db = getDB();

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw { status: 400, message: "No fields to update" };
  }

  values.push(id);

  const [result] = await db.query(
    `UPDATE employee_attendance SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  if (result.affectedRows === 0) {
    throw { status: 404, message: "Attendance not found" };
  }

  return { message: "Attendance updated successfully" };
};

export const deleteAttendance = async (id) => {
  const db = getDB();

  const [result] = await db.query(
    `DELETE FROM employee_attendance WHERE id = ?`,
    [id],
  );

  if (result.affectedRows === 0) {
    throw { status: 404, message: "Attendance not found" };
  }

  return { message: "Attendance deleted successfully" };
};
