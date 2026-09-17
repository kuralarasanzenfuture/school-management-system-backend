import { getDB } from "../../config/db.js";
import {
  validateManualAttendance,
  validateUpdateAttendance,
  NON_WORKING_STATUSES,
  normalizeDate,
} from "./employeeAttendance.validation.js";
import { EmployeeAttendanceModel as Model } from "./employeeAttendance.model.js";

/**
 * Returns today's date formatted as YYYY-MM-DD in local/IST (+05:30) time.
 */
export const getTodayDate = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
};

/**
 * Helper to parse a time or datetime string against a base date.
 */
export const parseTimeToDate = (timeStr, baseDateStr) => {
  if (!timeStr) return null;
  if (timeStr instanceof Date) return timeStr;

  const cleanDate =
    typeof baseDateStr === "string"
      ? baseDateStr.slice(0, 10)
      : baseDateStr instanceof Date
        ? baseDateStr.toISOString().slice(0, 10)
        : getTodayDate();

  if (typeof timeStr === "string") {
    const trimmed = timeStr.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return new Date(trimmed.replace(" ", "T"));
    }
    return new Date(`${cleanDate}T${trimmed}`);
  }
  return new Date(timeStr);
};

/**
 * Helper to compute work, late, and overtime minutes.
 */
export const calculateAttendanceMetrics = ({
  attendance_date,
  check_in,
  check_out,
  shift,
  late_minutes = 0,
  overtime_minutes = 0,
}) => {
  let total_work_minutes = 0;
  let calculatedLate = Number(late_minutes) || 0;
  let calculatedOvertime = Number(overtime_minutes) || 0;

  if (check_in && shift) {
    const inTime = parseTimeToDate(check_in, attendance_date);
    const shiftStart = parseTimeToDate(shift.start_time, attendance_date);

    if (inTime && shiftStart && !isNaN(inTime) && !isNaN(shiftStart)) {
      const diffLate = Math.floor((inTime - shiftStart) / 60000);
      const grace =
        shift.grace_minutes != null ? Number(shift.grace_minutes) : 10;
      if (diffLate > grace) {
        calculatedLate = diffLate;
      } else if (!late_minutes) {
        calculatedLate = 0;
      }
    }
  }

  if (check_in && check_out) {
    let inTime = parseTimeToDate(check_in, attendance_date);
    let outTime = parseTimeToDate(check_out, attendance_date);

    if (outTime < inTime) {
      outTime.setDate(outTime.getDate() + 1);
    }

    total_work_minutes = Math.floor((outTime - inTime) / 60000);

    if (total_work_minutes <= 0) {
      throw { status: 400, message: "Invalid working time" };
    }

    if (shift && shift.working_hours) {
      const expectedMinutes = Math.round(Number(shift.working_hours) * 60);
      if (total_work_minutes > expectedMinutes) {
        calculatedOvertime = total_work_minutes - expectedMinutes;
      } else if (!overtime_minutes) {
        calculatedOvertime = 0;
      }
    }
  }

  return {
    total_work_minutes,
    late_minutes: calculatedLate,
    overtime_minutes: calculatedOvertime,
  };
};

const checkIsAdmin = (user) => {
  if (!user) return false;
  const userRoles = Array.isArray(user.roles)
    ? user.roles.map((r) =>
        (typeof r === "string" ? r : r.name || "").toUpperCase(),
      )
    : user.role
      ? [String(user.role).toUpperCase()]
      : [];

  return userRoles.some(
    (r) => r === "ADMIN" || r === "SUPER ADMIN" || r === "SUPER_ADMIN",
  );
};

export const markManualAttendance = async (data) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateManualAttendance(data);

    await conn.beginTransaction();

    // 1. Check employee + get school_id
    const [[employee]] = await conn.query(
      `SELECT id, school_id FROM employees WHERE id=?`,
      [validated.employee_id],
    );

    if (!employee) {
      throw { status: 404, message: "Employee not found" };
    }

    const school_id = employee.school_id;

    // 2. Duplicate check
    const exists = await Model.findExisting(
      conn,
      validated.employee_id,
      validated.attendance_date,
    );

    if (exists) {
      throw { status: 409, message: "Attendance already marked" };
    }

    // 3. Shift logic: use provided shift or fallback to school default active shift
    let shift = null;
    if (validated.shift_id) {
      const [[shiftRow]] = await conn.query(
        `SELECT id, start_time, working_hours, grace_minutes, crosses_midnight, school_id 
         FROM employee_shifts WHERE id=?`,
        [validated.shift_id],
      );

      if (!shiftRow) {
        throw { status: 404, message: "Shift not found" };
      }

      if (shiftRow.school_id !== school_id) {
        throw {
          status: 400,
          message: "Shift does not belong to employee school",
        };
      }
      shift = shiftRow;
    } else {
      const [[defaultShift]] = await conn.query(
        `SELECT id, start_time, working_hours, grace_minutes, crosses_midnight, school_id 
         FROM employee_shifts 
         WHERE school_id = ? AND is_default = 1 AND status = 'active' 
         LIMIT 1`,
        [school_id],
      );
      if (defaultShift) {
        shift = defaultShift;
        validated.shift_id = defaultShift.id;
      }
    }

    // 4. Calculate metrics
    const { total_work_minutes, late_minutes, overtime_minutes } =
      calculateAttendanceMetrics({
        attendance_date: validated.attendance_date,
        check_in: validated.check_in,
        check_out: validated.check_out,
        shift,
        late_minutes: validated.late_minutes,
        overtime_minutes: validated.overtime_minutes,
      });

    // 5. Insert
    const id = await Model.create(conn, {
      ...validated,
      school_id,
      total_work_minutes,
      overtime_minutes,
      late_minutes,
    });

    await conn.commit();

    // 6. Fetch created record with joins
    const [[createdRecord]] = await db.query(
      `
      SELECT 
        ea.*,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.photo_url,
        e.mobile AS employee_mobile,
        e.designation,
        e.department,
        es.name AS shift_name,
        sc.name AS school_name
      FROM employee_attendance ea
      JOIN employees e ON ea.employee_id = e.id
      JOIN schools sc ON ea.school_id = sc.id
      LEFT JOIN employee_shifts es ON ea.shift_id = es.id
      WHERE ea.id = ?
      `,
      [id],
    );

    return {
      message: "Attendance marked successfully",
      id,
      record: createdRecord,
      data: createdRecord,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const checkInAttendance = async (user) => {
  const db = getDB();

  const today = getTodayDate();

  // 1. Get employee
  const [[employee]] = await db.query(
    `SELECT id, school_id FROM employees WHERE user_id = ?`,
    [user.id],
  );

  if (!employee) {
    throw { status: 404, message: "Employee not found" };
  }

  // 2. Check already checked in
  const [[existing]] = await db.query(
    `SELECT * FROM employee_attendance 
     WHERE employee_id = ? AND attendance_date = ?`,
    [employee.id, today],
  );

  if (existing && existing.check_in) {
    throw { status: 400, message: "Already checked in today" };
  }

  const now = new Date();

  // 3. Find shift (assigned on existing, or school default active shift)
  let shift_id = existing?.shift_id || null;
  let late_minutes = 0;
  let shift = null;

  if (shift_id) {
    const [[shiftRow]] = await db.query(
      `SELECT id, start_time, grace_minutes, working_hours FROM employee_shifts WHERE id = ?`,
      [shift_id],
    );
    shift = shiftRow;
  } else {
    const [[defaultShift]] = await db.query(
      `SELECT id, start_time, grace_minutes, working_hours 
       FROM employee_shifts 
       WHERE school_id = ? AND is_default = 1 AND status = 'active' 
       LIMIT 1`,
      [employee.school_id],
    );
    if (defaultShift) {
      shift = defaultShift;
      shift_id = defaultShift.id;
    }
  }

  // 4. Calculate lateness against shift start
  if (shift && shift.start_time) {
    const inTime = now;
    const shiftStart = parseTimeToDate(shift.start_time, today);
    if (shiftStart && !isNaN(shiftStart)) {
      const diffLate = Math.floor((inTime - shiftStart) / 60000);
      const grace =
        shift.grace_minutes != null ? Number(shift.grace_minutes) : 10;
      if (diffLate > grace) {
        late_minutes = diffLate;
      }
    }
  }

  // 5. Determine initial status
  const status = late_minutes > 0 ? "late" : "present";

  // 6. If an attendance row already exists, update it
  if (existing) {
    await db.query(
      `
      UPDATE employee_attendance
      SET status = ?, shift_id = ?, check_in = ?, late_minutes = ?
      WHERE id = ?
      `,
      [status, shift_id, now, late_minutes, existing.id],
    );
    return {
      message: "Check-in successful",
      id: existing.id,
      check_in: now,
      status,
      late_minutes,
    };
  }

  // 7. Insert new row
  const [res] = await db.query(
    `
    INSERT INTO employee_attendance
    (school_id, employee_id, attendance_date, status, shift_id, check_in, late_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [employee.school_id, employee.id, today, status, shift_id, now, late_minutes],
  );

  return {
    message: "Check-in successful",
    id: res.insertId,
    check_in: now,
    status,
    late_minutes,
  };
};

export const checkOutAttendance = async (user) => {
  const db = getDB();

  const today = getTodayDate();

  const [[employee]] = await db.query(
    `SELECT id FROM employees WHERE user_id = ?`,
    [user.id],
  );

  if (!employee) {
    throw { status: 404, message: "Employee not found" };
  }

  const [[attendance]] = await db.query(
    `SELECT * FROM employee_attendance 
     WHERE employee_id = ? AND attendance_date = ?`,
    [employee.id, today],
  );

  if (!attendance || !attendance.check_in) {
    throw { status: 400, message: "No check-in found for today" };
  }

  if (attendance.check_out) {
    throw { status: 400, message: "Already checked out" };
  }

  const now = new Date();

  // Work minutes
  const checkInTime = new Date(attendance.check_in);
  const diffMinutes = Math.max(0, Math.floor((now - checkInTime) / (1000 * 60)));

  // Overtime minutes calculation
  let overtime_minutes = 0;
  if (attendance.shift_id) {
    const [[shift]] = await db.query(
      `SELECT working_hours FROM employee_shifts WHERE id = ?`,
      [attendance.shift_id],
    );
    if (shift && shift.working_hours) {
      const expectedMinutes = Math.round(Number(shift.working_hours) * 60);
      if (diffMinutes > expectedMinutes) {
        overtime_minutes = diffMinutes - expectedMinutes;
      }
    }
  }

  await db.query(
    `
    UPDATE employee_attendance
    SET check_out = ?, total_work_minutes = ?, overtime_minutes = ?
    WHERE id = ?
    `,
    [now, diffMinutes, overtime_minutes, attendance.id],
  );

  return {
    message: "Check-out successful",
    id: attendance.id,
    check_out: now,
    total_work_minutes: diffMinutes,
    overtime_minutes,
  };
};

export const getTodayAttendance = async (user) => {
  const db = getDB();

  const today = getTodayDate();

  const [[employee]] = await db.query(
    `SELECT id, school_id FROM employees WHERE user_id = ?`,
    [user.id],
  );

  if (!employee) {
    throw { status: 404, message: "Employee not found" };
  }

  const [[attendance]] = await db.query(
    `
    SELECT
      ea.id,
      ea.school_id,
      ea.employee_id,
      ea.attendance_date,
      ea.status,
      ea.shift_id,
      es.name AS shift_name,
      ea.check_in,
      ea.check_out,
      ea.total_work_minutes,
      ea.overtime_minutes,
      ea.late_minutes,
      ea.remarks,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.photo_url,
      sc.name AS school_name
    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id
    WHERE ea.employee_id = ? AND ea.attendance_date = ?
    `,
    [employee.id, today],
  );

  return attendance || null;
};

export const getAllAttendance = async (filters = {}) => {
  const db = getDB();

  const {
    employee_id,
    school_id,
    status,
    date,
    attendance_date,
    month,
    year,
    from_date,
    to_date,
    shift_id,
    marked_by,
    late_only,
    overtime_only,
    search,
  } = filters;

  let query = `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.photo_url,
      e.mobile AS employee_mobile,
      e.designation,
      e.department,
      es.name AS shift_name,
      sc.name AS school_name
    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id
    WHERE 1=1
  `;

  const values = [];

  if (employee_id) {
    query += ` AND ea.employee_id = ?`;
    values.push(Number(employee_id));
  }

  if (school_id) {
    query += ` AND ea.school_id = ?`;
    values.push(Number(school_id));
  }

  if (status) {
    query += ` AND ea.status = ?`;
    values.push(status);
  }

  const targetDate = date || attendance_date;
  if (targetDate) {
    query += ` AND ea.attendance_date = ?`;
    values.push(normalizeDate(targetDate));
  }

  if (year) {
    query += ` AND YEAR(ea.attendance_date) = ?`;
    values.push(Number(year));
  }

  if (month) {
    query += ` AND MONTH(ea.attendance_date) = ?`;
    values.push(Number(month));
  }

  if (from_date) {
    query += ` AND ea.attendance_date >= ?`;
    values.push(from_date);
  }

  if (to_date) {
    query += ` AND ea.attendance_date <= ?`;
    values.push(to_date);
  }

  if (shift_id) {
    query += ` AND ea.shift_id = ?`;
    values.push(Number(shift_id));
  }

  if (marked_by) {
    query += ` AND ea.marked_by = ?`;
    values.push(Number(marked_by));
  }

  if (late_only === "true" || late_only === true) {
    query += ` AND ea.late_minutes > 0`;
  }

  if (overtime_only === "true" || overtime_only === true) {
    query += ` AND ea.overtime_minutes > 0`;
  }

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    query += ` AND (CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) LIKE ? OR e.employee_code LIKE ?)`;
    values.push(term, term);
  }

  query += ` ORDER BY ea.attendance_date DESC, ea.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const getAllAttendanceByToken = async (user, filters = {}) => {
  const db = getDB();

  if (!user) throw { status: 401, message: "Unauthorized" };

  const isAdmin = checkIsAdmin(user);

  let query = `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.photo_url,
      e.mobile AS employee_mobile,
      e.designation,
      e.department,
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
    values.push(Number(user.school_id));
  } else if (filters.school_id) {
    query += ` AND ea.school_id = ?`;
    values.push(Number(filters.school_id));
  }

  if (filters.employee_id) {
    query += ` AND ea.employee_id = ?`;
    values.push(Number(filters.employee_id));
  }

  if (filters.status) {
    query += ` AND ea.status = ?`;
    values.push(filters.status);
  }

  const targetDate = filters.date || filters.attendance_date;
  if (targetDate) {
    query += ` AND ea.attendance_date = ?`;
    values.push(normalizeDate(targetDate));
  }

  if (filters.year) {
    query += ` AND YEAR(ea.attendance_date) = ?`;
    values.push(Number(filters.year));
  }

  if (filters.month) {
    query += ` AND MONTH(ea.attendance_date) = ?`;
    values.push(Number(filters.month));
  }

  if (filters.from_date) {
    query += ` AND ea.attendance_date >= ?`;
    values.push(filters.from_date);
  }

  if (filters.to_date) {
    query += ` AND ea.attendance_date <= ?`;
    values.push(filters.to_date);
  }

  if (filters.shift_id) {
    query += ` AND ea.shift_id = ?`;
    values.push(Number(filters.shift_id));
  }

  if (filters.marked_by) {
    query += ` AND ea.marked_by = ?`;
    values.push(Number(filters.marked_by));
  }

  if (filters.late_only === "true" || filters.late_only === true) {
    query += ` AND ea.late_minutes > 0`;
  }

  if (filters.overtime_only === "true" || filters.overtime_only === true) {
    query += ` AND ea.overtime_minutes > 0`;
  }

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    query += ` AND (CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) LIKE ? OR e.employee_code LIKE ?)`;
    values.push(term, term);
  }

  query += ` ORDER BY ea.attendance_date DESC, ea.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const getAttendanceByFilters = async (filters = {}) => {
  const normalized = { ...filters };

  if (normalized.employee_id) {
    return getAttendanceByEmployee(normalized.employee_id, normalized);
  }

  const rows = await getAllAttendance(normalized);

  return {
    filters: {
      employee_id: normalized.employee_id
        ? Number(normalized.employee_id)
        : null,
      school_id: normalized.school_id ? Number(normalized.school_id) : null,
      status: normalized.status || null,
      date: normalized.date || normalized.attendance_date || null,
      month: normalized.month ? Number(normalized.month) : null,
      year: normalized.year ? Number(normalized.year) : null,
      from_date: normalized.from_date || null,
      to_date: normalized.to_date || null,
      shift_id: normalized.shift_id ? Number(normalized.shift_id) : null,
      marked_by: normalized.marked_by ? Number(normalized.marked_by) : null,
      late_only:
        normalized.late_only === "true" || normalized.late_only === true,
      overtime_only:
        normalized.overtime_only === "true" ||
        normalized.overtime_only === true,
    },
    total: Array.isArray(rows) ? rows.length : 0,
    data: rows,
  };
};

export const getAttendanceById = async (id) => {
  const db = getDB();

  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    throw { status: 400, message: "Valid attendance ID is required" };
  }

  const [[row]] = await db.query(
    `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.photo_url,
      e.mobile AS employee_mobile,
      e.designation,
      e.department,
      es.name AS shift_name,
      sc.name AS school_name
    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id
    WHERE ea.id = ?
    `,
    [Number(id)],
  );

  if (!row) throw { status: 404, message: "Attendance not found" };

  return row;
};

export const getAttendanceByEmployee = async (employee_id, filters = {}) => {
  const db = getDB();

  if (!employee_id || isNaN(Number(employee_id)) || Number(employee_id) <= 0) {
    throw { status: 400, message: "Valid employee_id is required" };
  }

  // Ensure employee exists
  const [[employee]] = await db.query(
    `SELECT id FROM employees WHERE id = ?`,
    [Number(employee_id)],
  );

  if (!employee) {
    throw { status: 404, message: "Employee not found" };
  }

  const {
    date,
    attendance_date,
    month,
    year,
    from_date,
    to_date,
    status,
    shift_id,
    marked_by,
    late_only,
    overtime_only,
    school_id,
  } = filters;

  let where = ` WHERE ea.employee_id = ? `;
  const params = [Number(employee_id)];

  if (school_id) {
    where += ` AND ea.school_id = ?`;
    params.push(Number(school_id));
  }

  const targetDate = date || attendance_date;
  if (targetDate) {
    where += ` AND ea.attendance_date = ?`;
    params.push(normalizeDate(targetDate));
  }

  if (year) {
    where += ` AND YEAR(ea.attendance_date) = ?`;
    params.push(Number(year));
  }

  if (month) {
    where += ` AND MONTH(ea.attendance_date) = ?`;
    params.push(Number(month));
  }

  if (from_date) {
    where += ` AND ea.attendance_date >= ?`;
    params.push(from_date);
  }

  if (to_date) {
    where += ` AND ea.attendance_date <= ?`;
    params.push(to_date);
  }

  if (status) {
    where += ` AND ea.status = ?`;
    params.push(status);
  }

  if (shift_id) {
    where += ` AND ea.shift_id = ?`;
    params.push(Number(shift_id));
  }

  if (marked_by) {
    where += ` AND ea.marked_by = ?`;
    params.push(Number(marked_by));
  }

  if (late_only === "true" || late_only === true) {
    where += ` AND ea.late_minutes > 0`;
  }

  if (overtime_only === "true" || overtime_only === true) {
    where += ` AND ea.overtime_minutes > 0`;
  }

  // Attendance Logs with complete employee & shift joins
  const [logs] = await db.query(
    `
    SELECT
      ea.*,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.photo_url,
      e.mobile AS employee_mobile,
      e.designation,
      e.department,
      es.name AS shift_name,
      sc.name AS school_name
    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id
    ${where}
    ORDER BY ea.attendance_date DESC, ea.id DESC
    `,
    params,
  );

  // Summary Metrics (COALESCE handles 0 records gracefully)
  const [summaryRows] = await db.query(
    `
    SELECT
      COUNT(*) AS total_records,

      COALESCE(SUM(ea.status='present'), 0)  AS present_days,
      COALESCE(SUM(ea.status='absent'), 0)   AS absent_days,
      COALESCE(SUM(ea.status='late'), 0)     AS late_days,
      COALESCE(SUM(ea.status='half_day'), 0) AS half_days,
      COALESCE(SUM(ea.status='leave'), 0)    AS leave_days,
      COALESCE(SUM(ea.status='holiday'), 0)  AS holiday_days,
      COALESCE(SUM(ea.status='week_off'), 0) AS week_off_days,

      COALESCE(SUM(ea.total_work_minutes), 0) AS total_work_minutes,
      COALESCE(SUM(ea.overtime_minutes), 0)   AS total_overtime_minutes,
      COALESCE(SUM(ea.late_minutes), 0)       AS total_late_minutes,

      COALESCE(ROUND(SUM(ea.total_work_minutes)/60, 2), 0) AS total_work_hours,
      COALESCE(ROUND(SUM(ea.overtime_minutes)/60, 2), 0)   AS total_overtime_hours,

      MIN(ea.attendance_date) AS first_attendance,
      MAX(ea.attendance_date) AS last_attendance
    FROM employee_attendance ea
    ${where}
    `,
    params,
  );

  return {
    filters: {
      employee_id: Number(employee_id),
      date: targetDate || null,
      month: month ? Number(month) : null,
      year: year ? Number(year) : null,
      from_date: from_date || null,
      to_date: to_date || null,
      status: status || null,
      shift_id: shift_id ? Number(shift_id) : null,
      marked_by: marked_by ? Number(marked_by) : null,
      late_only: late_only === "true" || late_only === true,
      overtime_only: overtime_only === "true" || overtime_only === true,
    },
    summary: summaryRows[0] || {},
    logs,
  };
};

export const getAttendanceByDateRange = async (queryParams = {}) => {
  const db = getDB();

  const { start_date, end_date, employee_id, school_id, status } = queryParams;

  if (!start_date || !end_date) {
    throw { status: 400, message: "start_date & end_date required" };
  }

  const normalizedStart = normalizeDate(start_date);
  const normalizedEnd = normalizeDate(end_date);

  if (new Date(normalizedStart) > new Date(normalizedEnd)) {
    throw { status: 400, message: "start_date cannot be greater than end_date" };
  }

  let query = `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.photo_url,
      e.mobile AS employee_mobile,
      e.designation,
      e.department,
      es.name AS shift_name,
      sc.name AS school_name
    FROM employee_attendance ea
    JOIN employees e ON ea.employee_id = e.id
    JOIN schools sc ON ea.school_id = sc.id
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id
    WHERE ea.attendance_date BETWEEN ? AND ?
  `;

  const values = [normalizedStart, normalizedEnd];

  if (employee_id) {
    query += ` AND ea.employee_id = ?`;
    values.push(Number(employee_id));
  }

  if (school_id) {
    query += ` AND ea.school_id = ?`;
    values.push(Number(school_id));
  }

  if (status) {
    query += ` AND ea.status = ?`;
    values.push(status);
  }

  query += ` ORDER BY ea.attendance_date DESC, ea.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

export const updateAttendance = async (id, rawData) => {
  const db = getDB();

  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    throw { status: 400, message: "Valid attendance ID is required" };
  }

  const validated = validateUpdateAttendance(rawData);

  const [[existing]] = await db.query(
    `SELECT * FROM employee_attendance WHERE id = ?`,
    [Number(id)],
  );

  if (!existing) {
    throw { status: 404, message: "Attendance not found" };
  }

  // Merged values
  const targetDate =
    validated.attendance_date !== undefined
      ? validated.attendance_date
      : existing.attendance_date;

  const targetStatus =
    validated.status !== undefined ? validated.status : existing.status;

  let targetShiftId =
    validated.shift_id !== undefined ? validated.shift_id : existing.shift_id;

  let targetCheckIn =
    validated.check_in !== undefined ? validated.check_in : existing.check_in;

  let targetCheckOut =
    validated.check_out !== undefined ? validated.check_out : existing.check_out;

  let manualLateMinutes =
    validated.late_minutes !== undefined
      ? validated.late_minutes
      : existing.late_minutes;

  let manualOvertimeMinutes =
    validated.overtime_minutes !== undefined
      ? validated.overtime_minutes
      : existing.overtime_minutes;

  // Check unique date conflict if attendance_date changed
  if (
    validated.attendance_date &&
    validated.attendance_date !== existing.attendance_date
  ) {
    const [[conflict]] = await db.query(
      `SELECT id FROM employee_attendance WHERE employee_id = ? AND attendance_date = ? AND id != ?`,
      [existing.employee_id, validated.attendance_date, Number(id)],
    );
    if (conflict) {
      throw { status: 409, message: "Attendance already marked for this date" };
    }
  }

  // Non-working status rule
  if (NON_WORKING_STATUSES.includes(targetStatus)) {
    if (rawData.check_in || rawData.check_out) {
      throw { status: 400, message: "Time not allowed for this status" };
    }
    targetCheckIn = null;
    targetCheckOut = null;
    manualLateMinutes = 0;
    manualOvertimeMinutes = 0;
  }

  if (targetCheckOut && !targetCheckIn) {
    throw {
      status: 400,
      message: "check_in is required when check_out is provided",
    };
  }

  // Fetch shift if shift_id present, or fallback to default active shift
  let shift = null;
  if (targetShiftId) {
    const [[shiftRow]] = await db.query(
      `SELECT id, start_time, working_hours, grace_minutes, crosses_midnight, school_id FROM employee_shifts WHERE id = ?`,
      [targetShiftId],
    );
    if (!shiftRow) {
      throw { status: 404, message: "Shift not found" };
    }
    if (shiftRow.school_id !== existing.school_id) {
      throw { status: 400, message: "Shift does not belong to employee school" };
    }
    shift = shiftRow;
  } else {
    const [[defaultShift]] = await db.query(
      `SELECT id, start_time, working_hours, grace_minutes, crosses_midnight, school_id 
       FROM employee_shifts 
       WHERE school_id = ? AND is_default = 1 AND status = 'active' 
       LIMIT 1`,
      [existing.school_id],
    );
    if (defaultShift) {
      shift = defaultShift;
      targetShiftId = defaultShift.id;
    }
  }

  // Calculate metrics
  let total_work_minutes = 0;
  let late_minutes = 0;
  let overtime_minutes = 0;

  if (!NON_WORKING_STATUSES.includes(targetStatus)) {
    const metrics = calculateAttendanceMetrics({
      attendance_date: targetDate,
      check_in: targetCheckIn,
      check_out: targetCheckOut,
      shift,
      late_minutes: manualLateMinutes,
      overtime_minutes: manualOvertimeMinutes,
    });
    total_work_minutes = metrics.total_work_minutes;
    late_minutes = metrics.late_minutes;
    overtime_minutes = metrics.overtime_minutes;
  }

  const updateData = {
    ...validated,
    status: targetStatus,
    shift_id: targetShiftId,
    check_in: targetCheckIn,
    check_out: targetCheckOut,
    total_work_minutes,
    late_minutes,
    overtime_minutes,
  };

  const result = await Model.update(db, Number(id), updateData);

  if (result.affectedRows === 0) {
    throw { status: 404, message: "Attendance not found" };
  }

  // Fetch full updated record with employee, school, and shift joins
  const updatedRecord = await getAttendanceById(Number(id));

  return {
    message: "Attendance updated successfully",
    id: Number(id),
    record: updatedRecord,
    data: updatedRecord,
  };
};

export const deleteAttendance = async (id) => {
  const db = getDB();

  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    throw { status: 400, message: "Valid attendance ID is required" };
  }

  const result = await Model.delete(db, Number(id));

  if (result.affectedRows === 0) {
    throw { status: 404, message: "Attendance not found" };
  }

  return {
    message: "Attendance deleted successfully",
    id: Number(id),
  };
};
