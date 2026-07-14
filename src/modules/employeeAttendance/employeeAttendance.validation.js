// employeeAttendance.validation.js

export const validateManualAttendance = (data) => {
  let {
    school_id,
    employee_id,
    attendance_date,
    status,
    shift_id,
    check_in,
    check_out,
    remarks,
  } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!employee_id) throw { status: 400, message: "employee_id required" };
  if (!attendance_date)
    throw { status: 400, message: "attendance_date required" };
  if (!status) throw { status: 400, message: "status required" };

  const allowed = [
    "present",
    "absent",
    "late",
    "half_day",
    "leave",
    "holiday",
    "week_off",
  ];

  if (!allowed.includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id: Number(school_id),
    employee_id: Number(employee_id),
    attendance_date,
    status,
    shift_id: shift_id ? Number(shift_id) : null,
    check_in: check_in || null,
    check_out: check_out || null,
    remarks: remarks || null,
  };
};
