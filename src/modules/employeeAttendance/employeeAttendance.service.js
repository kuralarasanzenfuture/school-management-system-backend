import { getDB } from "../../config/db.js";
import { validateManualAttendance } from "./employeeAttendance.validation.js";
import { EmployeeAttendanceModel as Model } from "./employeeAttendance.model.js";

export const markManualAttendance = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateManualAttendance(data);

    await conn.beginTransaction();

    // 🔴 Check duplicate
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

    // 🔥 Calculate only if times present
    if (validated.check_in && validated.check_out) {
      const inTime = new Date(validated.check_in);
      const outTime = new Date(validated.check_out);

      total_work_minutes = Math.floor((outTime - inTime) / 60000);

      // 🔥 Fetch shift (if exists)
      if (validated.shift_id) {
        const [[shift]] = await conn.query(
          `SELECT start_time, working_hours, grace_minutes 
           FROM employee_shifts WHERE id=?`,
          [validated.shift_id],
        );

        if (shift) {
          const shiftStart = new Date(
            `${validated.attendance_date} ${shift.start_time}`,
          );

          const diffLate = Math.floor((inTime - shiftStart) / 60000);

          if (diffLate > shift.grace_minutes) {
            late_minutes = diffLate;
          }

          const expectedMinutes = shift.working_hours * 60;

          if (total_work_minutes > expectedMinutes) {
            overtime_minutes = total_work_minutes - expectedMinutes;
          }
        }
      }
    }

    const id = await Model.create(conn, {
      ...validated,
      total_work_minutes,
      overtime_minutes,
      late_minutes,
    });

    await conn.commit();

    return { message: "Attendance marked", id };
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

export const getAttendanceByEmployee = async (employee_id) => {
  const db = getDB();

  const [rows] = await db.query(
    `
    SELECT * FROM employee_attendance
    WHERE employee_id = ?
    ORDER BY attendance_date DESC
    `,
    [employee_id],
  );

  return rows;
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
