const allowedStatus = ["present", "absent", "late", "half_day", "leave"];

export const validateAttendance = (data) => {
  if (!data.class_section_id)
    throw { status: 400, message: "class_section_id required" };

  if (!data.attendance_date)
    throw { status: 400, message: "attendance_date required" };

  if (!Array.isArray(data.students))
    throw { status: 400, message: "students required" };

  if (!data.students.length) throw { status: 400, message: "students empty" };

  return {
    class_section_id: Number(data.class_section_id),
    attendance_date: data.attendance_date,
    attendance_type: data.attendance_type || "daily",
    period_no: data.period_no || null,
    remarks: data.remarks || null,

    students: data.students.map((s) => {
      if (!s.admission_id)
        throw { status: 400, message: "admission_id required" };

      if (!allowedStatus.includes(s.status))
        throw { status: 400, message: "Invalid attendance status" };

      return {
        admission_id: Number(s.admission_id),
        status: s.status,
        remarks: s.remarks || null,
      };
    }),
  };
};
