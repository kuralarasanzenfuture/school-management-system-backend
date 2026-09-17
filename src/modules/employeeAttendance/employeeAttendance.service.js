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

  if (typeof timeStr === "string") {
    const trimmed = timeStr.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return new Date(trimmed.replace(" ", "T"));
    }
    return new Date(`${baseDateStr}T${trimmed}`);
  }
  return new Date(timeStr);
};

/**
 * Helper to format a datetime/time string into a clean "09:05 AM" string.
 */
export const formatTime = (datetimeStr) => {
  if (!datetimeStr) return null;
  const d = new Date(datetimeStr);
  if (!isNaN(d.getTime())) {
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${minutes} ${ampm}`;
  }
  const match = String(datetimeStr).match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }
  return String(datetimeStr);
};

/**
 * Maps attendance status enum to UI single/two-letter badge codes.
 */
/**
 * Helper to compute week boundaries (Monday to Sunday) for a given reference date (YYYY-MM-DD).
 */
export const getWeekRange = (refDateStr) => {
  const d = refDateStr ? new Date(`${refDateStr}T00:00:00`) : new Date();
  const day = d.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dayNum = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayNum}`;
  };

  return {
    startDate: format(monday),
    endDate: format(sunday),
  };
};

/**
 * Helper to compute ISO 8601 week number.
 */
export const getISOWeekNumber = (dateObj) => {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const mapStatusCode = (status) => {
  switch (status) {
    case "present":
      return "P";
    case "absent":
      return "A";
    case "late":
      return "L";
    case "half_day":
      return "HD";
    case "leave":
      return "LV";
    case "holiday":
      return "H";
    case "week_off":
      return "WO";
    default:
      return "-";
  }
};

/**
 * Helper to compute work, late, and overtime minutes.
 */
export const calculateAttendanceMetrics = ({
  attendance_date,
  check_in,
  check_out,
  shift,
}) => {
  let total_work_minutes = 0;
  let late_minutes = 0;
  let overtime_minutes = 0;

  if (check_in && shift) {
    const inTime = parseTimeToDate(check_in, attendance_date);
    const shiftStart = parseTimeToDate(shift.start_time, attendance_date);

    if (inTime && shiftStart && !isNaN(inTime) && !isNaN(shiftStart)) {
      const diffLate = Math.floor((inTime - shiftStart) / 60000);
      const grace = shift.grace_minutes != null ? Number(shift.grace_minutes) : 10;
      if (diffLate > grace) {
        late_minutes = diffLate;
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
        overtime_minutes = total_work_minutes - expectedMinutes;
      }
    }
  }

  return { total_work_minutes, late_minutes, overtime_minutes };
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

    // 3. Shift logic
    let shift = null;
    if (validated.shift_id) {
      const [[shiftRow]] = await conn.query(
        `SELECT start_time, working_hours, grace_minutes, crosses_midnight, school_id 
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
    }

    // 4. Calculate metrics
    const { total_work_minutes, late_minutes, overtime_minutes } =
      calculateAttendanceMetrics({
        attendance_date: validated.attendance_date,
        check_in: validated.check_in,
        check_out: validated.check_out,
        shift,
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

  if (shift) {
    const inTime = now;
    const shiftStart = parseTimeToDate(shift.start_time, today);
    if (inTime && shiftStart && !isNaN(shiftStart.getTime())) {
      const diffLate = Math.floor((inTime - shiftStart) / 60000);
      const grace = shift.grace_minutes != null ? Number(shift.grace_minutes) : 10;
      if (diffLate > grace) {
        late_minutes = diffLate;
      }
    }
  }

  if (existing) {
    // Update existing attendance row instead of crashing on unique key
    await db.query(
      `
      UPDATE employee_attendance
      SET status = 'present',
          check_in = ?,
          shift_id = COALESCE(shift_id, ?),
          late_minutes = ?,
          marked_by = ?
      WHERE id = ?
      `,
      [now, shift_id, late_minutes, user.id, existing.id],
    );
  } else {
    // Insert new attendance record
    await db.query(
      `
      INSERT INTO employee_attendance
      (school_id, employee_id, attendance_date, status, shift_id, check_in, late_minutes, marked_by)
      VALUES (?, ?, ?, 'present', ?, ?, ?, ?)
      `,
      [employee.school_id, employee.id, today, shift_id, now, late_minutes, user.id],
    );
  }

  return { message: "Check-in successful", check_in: now, late_minutes };
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
      ea.remarks
    FROM employee_attendance ea
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
    month,
    year,
    from_date,
    to_date,
    shift_id,
    marked_by,
    late_only,
    overtime_only,
  } = filters;

  let query = `
    SELECT 
      ea.*,
      e.first_name,
      e.last_name,
      e.photo_url,
      e.mobile AS employee_mobile,
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
      e.photo_url,
      e.mobile AS employee_mobile,
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

  const targetDate = filters.date || filters.attendance_date;
  if (targetDate) {
    query += ` AND ea.attendance_date = ?`;
    values.push(normalizeDate(targetDate));
  }

  if (filters.department && String(filters.department).trim()) {
    query += ` AND e.department = ?`;
    values.push(String(filters.department).trim());
  }

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    query += ` AND (CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) LIKE ? OR e.employee_code LIKE ?)`;
    values.push(term, term);
  }

  if (filters.status) {
    query += ` AND ea.status = ?`;
    values.push(filters.status);
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

  query += ` ORDER BY ea.attendance_date DESC, ea.id DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

/**
 * UI-Ready Structured Attendance Matrix (Employee × Days)
 * Supports Monthly, Weekly, and Daily views.
 */
export const getAttendanceMatrix = async (filters = {}, user = null) => {
  const db = getDB();

  // 1. Resolve school_id
  let school_id = filters.school_id ? Number(filters.school_id) : null;
  if (!school_id && user?.school_id) {
    school_id = Number(user.school_id);
  }

  // 2. Resolve view mode: 'monthly' (default), 'weekly', 'daily'
  const view = (filters.view || "monthly").toLowerCase();

  const todayStr = getTodayDate();
  const [currentYear, currentMonth] = todayStr.split("-").map(Number);

  let startDate, endDate;
  let month = filters.month ? Number(filters.month) : null;
  let year = filters.year ? Number(filters.year) : null;

  if (view === "daily") {
    const targetDate = filters.date ? normalizeDate(filters.date) : todayStr;
    startDate = targetDate;
    endDate = targetDate;
    const [y, m] = targetDate.split("-").map(Number);
    year = y;
    month = m;
  } else if (view === "weekly" || filters.week || (filters.from_date && !filters.month)) {
    if (filters.from_date && filters.to_date) {
      startDate = normalizeDate(filters.from_date);
      endDate = normalizeDate(filters.to_date);
    } else if (filters.from_date) {
      const sObj = new Date(`${normalizeDate(filters.from_date)}T00:00:00`);
      const eObj = new Date(sObj);
      eObj.setDate(sObj.getDate() + 6);
      startDate = normalizeDate(filters.from_date);
      const y = eObj.getFullYear();
      const m = String(eObj.getMonth() + 1).padStart(2, "0");
      const d = String(eObj.getDate()).padStart(2, "0");
      endDate = `${y}-${m}-${d}`;
    } else {
      const refDate = filters.date || filters.week_date || todayStr;
      const range = getWeekRange(refDate);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    const [y, m] = startDate.split("-").map(Number);
    year = y;
    month = m;
  } else {
    // Monthly view (default)
    if (!year) year = currentYear;
    if (!month) month = currentMonth;

    const daysInMonth = new Date(year, month, 0).getDate();
    startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  }

  // 3. Build days_meta array
  const daysMeta = [];
  const startD = new Date(`${startDate}T00:00:00`);
  const endD = new Date(`${endDate}T00:00:00`);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = d.getDate();
    const dayStr = String(dayNum).padStart(2, "0");
    const dateFormatted = `${y}-${m}-${dayStr}`;
    const dayOfWeek = d.getDay();

    daysMeta.push({
      day: dayNum,
      date: dateFormatted,
      day_name: dayNames[dayOfWeek],
      day_abbr: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][dayOfWeek],
      day_of_week: dayOfWeek,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
      is_today: dateFormatted === todayStr,
    });
  }

  // 4. Query employees
  let empQuery = `
    SELECT 
      e.id,
      e.school_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.photo_url,
      e.designation,
      e.department,
      e.mobile,
      sc.name AS school_name
    FROM employees e
    LEFT JOIN schools sc ON e.school_id = sc.id
    WHERE e.status = 'active'
  `;
  const empParams = [];

  if (school_id) {
    empQuery += ` AND e.school_id = ?`;
    empParams.push(school_id);
  }

  if (filters.employee_id) {
    empQuery += ` AND e.id = ?`;
    empParams.push(Number(filters.employee_id));
  }

  if (filters.department) {
    empQuery += ` AND e.department = ?`;
    empParams.push(filters.department);
  }

  if (filters.designation) {
    empQuery += ` AND e.designation = ?`;
    empParams.push(filters.designation);
  }

  if (filters.search) {
    empQuery += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ?)`;
    const term = `%${filters.search.trim()}%`;
    empParams.push(term, term, term);
  }

  empQuery += ` ORDER BY e.first_name ASC, e.last_name ASC`;

  const [employees] = await db.query(empQuery, empParams);

  // 5. Query attendance rows in range
  let attQuery = `
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
      ea.remarks
    FROM employee_attendance ea
    LEFT JOIN employee_shifts es ON ea.shift_id = es.id
    WHERE ea.attendance_date BETWEEN ? AND ?
  `;
  const attParams = [startDate, endDate];

  if (school_id) {
    attQuery += ` AND ea.school_id = ?`;
    attParams.push(school_id);
  }

  if (filters.employee_id) {
    attQuery += ` AND ea.employee_id = ?`;
    attParams.push(Number(filters.employee_id));
  }

  if (filters.shift_id) {
    attQuery += ` AND ea.shift_id = ?`;
    attParams.push(Number(filters.shift_id));
  }

  const [attendanceRows] = await db.query(attQuery, attParams);

  const attendanceMap = new Map();
  for (const row of attendanceRows) {
    const dateStr = typeof row.attendance_date === "string"
      ? row.attendance_date.slice(0, 10)
      : new Intl.DateTimeFormat("en-CA").format(new Date(row.attendance_date));
    attendanceMap.set(`${row.employee_id}_${dateStr}`, row);
  }

  // 6. Build matrix per employee
  const overallStats = {
    total_records: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    half_days: 0,
    leave_days: 0,
    holiday_days: 0,
    week_off_days: 0,
    total_work_minutes: 0,
    total_overtime_minutes: 0,
    total_late_minutes: 0,
  };

  const employeeMatrix = employees.map((emp) => {
    const empAttendance = {};
    const empSummary = {
      present_days: 0,
      absent_days: 0,
      late_days: 0,
      half_days: 0,
      leave_days: 0,
      holiday_days: 0,
      week_off_days: 0,
      total_work_minutes: 0,
      total_work_hours: "0.00",
      total_overtime_minutes: 0,
      total_overtime_hours: "0.00",
      total_late_minutes: 0,
      marked_days: 0,
      attendance_percentage: "0%",
    };

    for (const dayMeta of daysMeta) {
      const key = `${emp.id}_${dayMeta.date}`;
      const row = attendanceMap.get(key);

      if (row) {
        empSummary.marked_days++;
        overallStats.total_records++;

        if (row.status === "present") {
          empSummary.present_days++;
          overallStats.present_days++;
        } else if (row.status === "absent") {
          empSummary.absent_days++;
          overallStats.absent_days++;
        } else if (row.status === "late") {
          empSummary.late_days++;
          overallStats.late_days++;
        } else if (row.status === "half_day") {
          empSummary.half_days++;
          overallStats.half_days++;
        } else if (row.status === "leave") {
          empSummary.leave_days++;
          overallStats.leave_days++;
        } else if (row.status === "holiday") {
          empSummary.holiday_days++;
          overallStats.holiday_days++;
        } else if (row.status === "week_off") {
          empSummary.week_off_days++;
          overallStats.week_off_days++;
        }

        const workMin = row.total_work_minutes || 0;
        const otMin = row.overtime_minutes || 0;
        const lateMin = row.late_minutes || 0;

        empSummary.total_work_minutes += workMin;
        overallStats.total_work_minutes += workMin;

        empSummary.total_overtime_minutes += otMin;
        overallStats.total_overtime_minutes += otMin;

        empSummary.total_late_minutes += lateMin;
        overallStats.total_late_minutes += lateMin;

        const cellObj = {
          id: row.id,
          attendance_date: dayMeta.date,
          status: row.status,
          code: mapStatusCode(row.status),
          check_in: row.check_in,
          check_out: row.check_out,
          check_in_time: formatTime(row.check_in),
          check_out_time: formatTime(row.check_out),
          total_work_minutes: workMin,
          total_work_hours: (workMin / 60).toFixed(2),
          late_minutes: lateMin,
          overtime_minutes: otMin,
          is_late: Boolean(lateMin > 0 || row.status === "late"),
          is_overtime: Boolean(otMin > 0),
          shift_id: row.shift_id || null,
          shift_name: row.shift_name || null,
          remarks: row.remarks || null,
        };
        empAttendance[dayMeta.day] = cellObj;
        empAttendance[dayMeta.date] = cellObj;
      } else {
        const emptyCell = {
          id: null,
          attendance_date: dayMeta.date,
          status: null,
          code: "-",
          check_in: null,
          check_out: null,
          check_in_time: null,
          check_out_time: null,
          total_work_minutes: 0,
          total_work_hours: "0.00",
          late_minutes: 0,
          overtime_minutes: 0,
          is_late: false,
          is_overtime: false,
          shift_id: null,
          shift_name: null,
          remarks: null,
        };
        empAttendance[dayMeta.day] = emptyCell;
        empAttendance[dayMeta.date] = emptyCell;
      }
    }

    empSummary.total_work_hours = (empSummary.total_work_minutes / 60).toFixed(2);
    empSummary.total_overtime_hours = (empSummary.total_overtime_minutes / 60).toFixed(2);
    const presentEquiv = empSummary.present_days + empSummary.late_days + empSummary.half_days * 0.5;
    const workingDaysCount = daysMeta.filter((d) => !d.is_weekend).length || daysMeta.length;
    empSummary.attendance_percentage =
      workingDaysCount > 0
        ? `${Math.min(100, Math.round((presentEquiv / workingDaysCount) * 100))}%`
        : "0%";

    return {
      employee_id: emp.id,
      school_id: emp.school_id,
      school_name: emp.school_name,
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
      photo_url: emp.photo_url,
      designation: emp.designation,
      department: emp.department,
      mobile: emp.mobile,
      summary: empSummary,
      attendance: empAttendance,
    };
  });

  const startDObj = new Date(`${startDate}T00:00:00`);
  const endDObj = new Date(`${endDate}T00:00:00`);
  const weekNumber = getISOWeekNumber(startDObj);
  const weekLabel = `${startDObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return {
    view,
    month: Number(month),
    year: Number(year),
    start_date: startDate,
    end_date: endDate,
    week_number: weekNumber,
    week_label: weekLabel,
    total_days: daysMeta.length,
    days: daysMeta.length,
    days_meta: daysMeta,
    total_employees: employees.length,
    school_id: school_id || null,
    overall_summary: {
      ...overallStats,
      total_work_hours: (overallStats.total_work_minutes / 60).toFixed(2),
      total_overtime_hours: (overallStats.total_overtime_minutes / 60).toFixed(2),
      avg_work_hours: employees.length > 0 ? (overallStats.total_work_minutes / 60 / employees.length).toFixed(1) : "0.0",
    },
    employees: employeeMatrix,
    flat_records: attendanceRows,
  };
};

export const getAttendanceByFilters = async (filters = {}, user = null) => {
  // If explicitly requesting flat rows
  if (filters.format === "flat" || filters.flat === "true") {
    const normalized = { ...filters };
    const rows = await getAllAttendance(normalized);
    return {
      filters: normalized,
      total: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    };
  }

  // If a specific employee_id is requested without month/year/view, return employee detail
  if (filters.employee_id && !filters.month && !filters.year && !filters.view) {
    return getAttendanceByEmployee(filters.employee_id, filters);
  }

  // Default: Return rich structured matrix directly mapped to the UI grid!
  return getAttendanceMatrix(filters, user);
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
      e.photo_url,
      e.mobile AS employee_mobile,
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

  // Attendance Logs
  const [logs] = await db.query(
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
      ea.marked_by,
      ea.created_at,
      ea.updated_at
    FROM employee_attendance ea
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
      e.photo_url,
      e.mobile AS employee_mobile,
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

  const targetShiftId =
    validated.shift_id !== undefined ? validated.shift_id : existing.shift_id;

  let targetCheckIn =
    validated.check_in !== undefined ? validated.check_in : existing.check_in;

  let targetCheckOut =
    validated.check_out !== undefined ? validated.check_out : existing.check_out;

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
  }

  if (targetCheckOut && !targetCheckIn) {
    throw {
      status: 400,
      message: "check_in is required when check_out is provided",
    };
  }

  // Fetch shift if shift_id present
  let shift = null;
  if (targetShiftId) {
    const [[shiftRow]] = await db.query(
      `SELECT start_time, working_hours, grace_minutes, school_id FROM employee_shifts WHERE id = ?`,
      [targetShiftId],
    );
    if (!shiftRow) {
      throw { status: 404, message: "Shift not found" };
    }
    if (shiftRow.school_id !== existing.school_id) {
      throw { status: 400, message: "Shift does not belong to employee school" };
    }
    shift = shiftRow;
  }

  // Calculate metrics
  const { total_work_minutes, late_minutes, overtime_minutes } =
    calculateAttendanceMetrics({
      attendance_date: targetDate,
      check_in: targetCheckIn,
      check_out: targetCheckOut,
      shift,
    });

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

  return { message: "Attendance updated successfully" };
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

  return { message: "Attendance deleted successfully" };
};
