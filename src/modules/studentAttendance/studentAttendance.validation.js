const allowedStatus = ["present", "absent", "late", "half_day", "leave"];

export const validateAttendance = (data) => {
  if (!data) {
    throw { status: 400, message: "Request body is required" };
  }

  if (!data.class_section_id) {
    throw { status: 400, message: "class_section_id required" };
  }

  if (!data.attendance_date) {
    throw { status: 400, message: "attendance_date required" };
  }

  if (!Array.isArray(data.students) || !data.students.length) {
    throw { status: 400, message: "students required and must not be empty" };
  }

  const type = data.attendance_type || "daily";

  if (!["daily", "period"].includes(type)) {
    throw {
      status: 400,
      message: "attendance_type must be either 'daily' or 'period'",
    };
  }

  let period_no = 0;

  // 🔴 STRICT PERIOD RULES
  if (type === "daily") {
    // For daily attendance, period_no must always be 0 (default 0)
    if (
      data.period_no !== undefined &&
      data.period_no !== null &&
      Number(data.period_no) !== 0
    ) {
      throw {
        status: 400,
        message: "Daily attendance must have period_no 0",
      };
    }
    period_no = 0;
  } else if (type === "period") {
    const parsedPeriod = Number(data.period_no);
    if (
      data.period_no === undefined ||
      data.period_no === null ||
      isNaN(parsedPeriod) ||
      parsedPeriod <= 0
    ) {
      throw {
        status: 400,
        message: "period_no must be a positive integer greater than 0 for period attendance",
      };
    }
    period_no = parsedPeriod;
  }

  return {
    class_section_id: Number(data.class_section_id),
    attendance_date: data.attendance_date,
    attendance_type: type,
    period_no,
    remarks: data.remarks || null,
    allow_update: Boolean(
      data.allow_update || data.update || data.overwrite || data.is_update
    ),

    students: data.students.map((s, i) => {
      if (!s.admission_id && !s.student_id) {
        throw {
          status: 400,
          message: `admission_id or student_id required for student at index ${i}`,
        };
      }

      if (!allowedStatus.includes(s.status)) {
        throw {
          status: 400,
          message: `Invalid status '${s.status}' at index ${i}. Allowed: ${allowedStatus.join(", ")}`,
        };
      }

      return {
        admission_id: s.admission_id ? Number(s.admission_id) : null,
        student_id: s.student_id ? Number(s.student_id) : null,
        status: s.status,
        remarks: s.remarks || null,
      };
    }),
  };
};
