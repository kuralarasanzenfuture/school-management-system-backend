const allowedStatus = ["present", "absent", "late", "half_day", "leave"];

export const validateAttendance = (data) => {
  if (!data.class_section_id) {
    throw { status: 400, message: "class_section_id required" };
  }

  if (!data.attendance_date) {
    throw { status: 400, message: "attendance_date required" };
  }

  if (!Array.isArray(data.students) || !data.students.length) {
    throw { status: 400, message: "students required" };
  }

  const type = data.attendance_type || "daily";

  // 🔴 STRICT RULES
  if (
    type === "daily" &&
    data.period_no !== null &&
    data.period_no !== undefined
  ) {
    throw {
      status: 400,
      message: "Daily attendance must NOT have period_no",
    };
  }

  if (type === "period" && !data.period_no) {
    throw {
      status: 400,
      message: "period_no required for period attendance",
    };
  }

  return {
    class_section_id: Number(data.class_section_id),
    attendance_date: data.attendance_date,
    attendance_type: type,
    period_no: type === "period" ? Number(data.period_no) : null,
    remarks: data.remarks || null,

    students: data.students.map((s, i) => {
      if (!s.admission_id) {
        throw { status: 400, message: `admission_id missing at index ${i}` };
      }

      if (!allowedStatus.includes(s.status)) {
        throw {
          status: 400,
          message: `Invalid status for admission_id ${s.admission_id}`,
        };
      }

      return {
        admission_id: Number(s.admission_id),
        status: s.status,
        remarks: s.remarks || null,
      };
    }),
  };
};
