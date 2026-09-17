// employeeAttendance.validation.js

export const ALLOWED_STATUSES = [
  "present",
  "absent",
  "late",
  "half_day",
  "leave",
  "holiday",
  "week_off",
];

export const NON_WORKING_STATUSES = ["absent", "holiday", "week_off", "leave"];

/**
 * Normalizes and validates a date string to YYYY-MM-DD format.
 */
export const normalizeDate = (dateStr) => {
  if (!dateStr) return null;

  if (typeof dateStr === "string") {
    // If ISO or datetime string, extract date part
    const match = dateStr.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return match[1];
      }
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw { status: 400, message: "Invalid attendance_date format" };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const validateManualAttendance = (data) => {
  let {
    employee_id,
    attendance_date,
    status,
    shift_id,
    check_in,
    check_out,
    late_minutes,
    overtime_minutes,
    remarks,
    marked_by,
  } = data;

  if (!employee_id || isNaN(Number(employee_id)) || Number(employee_id) <= 0) {
    throw { status: 400, message: "Valid employee_id is required" };
  }

  if (!attendance_date) {
    throw { status: 400, message: "attendance_date required" };
  }

  const normalizedDate = normalizeDate(attendance_date);

  if (!status) {
    throw { status: 400, message: "status required" };
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw {
      status: 400,
      message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
    };
  }

  if (shift_id !== undefined && shift_id !== null && shift_id !== "") {
    if (isNaN(Number(shift_id)) || Number(shift_id) <= 0) {
      throw { status: 400, message: "Invalid shift_id" };
    }
  }

  // Time validation
  if (check_in && isNaN(new Date(check_in).getTime())) {
    throw { status: 400, message: "Invalid check_in" };
  }

  if (check_out && isNaN(new Date(check_out).getTime())) {
    throw { status: 400, message: "Invalid check_out" };
  }

  if (check_out && !check_in) {
    throw {
      status: 400,
      message: "check_in is required when check_out is provided",
    };
  }

  let validatedLateMinutes = 0;
  if (late_minutes !== undefined && late_minutes !== null && late_minutes !== "") {
    if (isNaN(Number(late_minutes)) || Number(late_minutes) < 0) {
      throw { status: 400, message: "Invalid late_minutes" };
    }
    validatedLateMinutes = Math.floor(Number(late_minutes));
  }

  let validatedOvertimeMinutes = 0;
  if (overtime_minutes !== undefined && overtime_minutes !== null && overtime_minutes !== "") {
    if (isNaN(Number(overtime_minutes)) || Number(overtime_minutes) < 0) {
      throw { status: 400, message: "Invalid overtime_minutes" };
    }
    validatedOvertimeMinutes = Math.floor(Number(overtime_minutes));
  }

  // Non-working status rule
  if (NON_WORKING_STATUSES.includes(status)) {
    if (check_in || check_out) {
      throw {
        status: 400,
        message: "Time not allowed for this status",
      };
    }
    validatedLateMinutes = 0;
    validatedOvertimeMinutes = 0;
  }

  return {
    employee_id: Number(employee_id),
    attendance_date: normalizedDate,
    status,
    shift_id: shift_id ? Number(shift_id) : null,
    check_in: check_in || null,
    check_out: check_out || null,
    late_minutes: validatedLateMinutes,
    overtime_minutes: validatedOvertimeMinutes,
    remarks: remarks || null,
    marked_by: marked_by ? Number(marked_by) : null,
  };
};

export const validateUpdateAttendance = (data) => {
  const sanitized = {};

  if (data.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(data.status)) {
      throw {
        status: 400,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
      };
    }
    sanitized.status = data.status;
  }

  if (data.attendance_date !== undefined) {
    sanitized.attendance_date = normalizeDate(data.attendance_date);
  }

  if (data.shift_id !== undefined) {
    if (data.shift_id === null || data.shift_id === "") {
      sanitized.shift_id = null;
    } else if (isNaN(Number(data.shift_id)) || Number(data.shift_id) <= 0) {
      throw { status: 400, message: "Invalid shift_id" };
    } else {
      sanitized.shift_id = Number(data.shift_id);
    }
  }

  if (data.check_in !== undefined) {
    if (data.check_in === null || data.check_in === "") {
      sanitized.check_in = null;
    } else if (isNaN(new Date(data.check_in).getTime())) {
      throw { status: 400, message: "Invalid check_in" };
    } else {
      sanitized.check_in = data.check_in;
    }
  }

  if (data.check_out !== undefined) {
    if (data.check_out === null || data.check_out === "") {
      sanitized.check_out = null;
    } else if (isNaN(new Date(data.check_out).getTime())) {
      throw { status: 400, message: "Invalid check_out" };
    } else {
      sanitized.check_out = data.check_out;
    }
  }

  if (data.late_minutes !== undefined) {
    if (data.late_minutes === null || data.late_minutes === "") {
      sanitized.late_minutes = 0;
    } else if (isNaN(Number(data.late_minutes)) || Number(data.late_minutes) < 0) {
      throw { status: 400, message: "Invalid late_minutes" };
    } else {
      sanitized.late_minutes = Math.floor(Number(data.late_minutes));
    }
  }

  if (data.overtime_minutes !== undefined) {
    if (data.overtime_minutes === null || data.overtime_minutes === "") {
      sanitized.overtime_minutes = 0;
    } else if (isNaN(Number(data.overtime_minutes)) || Number(data.overtime_minutes) < 0) {
      throw { status: 400, message: "Invalid overtime_minutes" };
    } else {
      sanitized.overtime_minutes = Math.floor(Number(data.overtime_minutes));
    }
  }

  if (data.remarks !== undefined) {
    sanitized.remarks = data.remarks || null;
  }

  if (data.marked_by !== undefined) {
    sanitized.marked_by = data.marked_by ? Number(data.marked_by) : null;
  }

  return sanitized;
};
