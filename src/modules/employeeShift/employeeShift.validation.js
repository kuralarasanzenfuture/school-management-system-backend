// employeeShift.validation.js

export const validateCreateShift = (data) => {
  let { school_id, name, start_time, end_time, grace_minutes, status } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name) throw { status: 400, message: "name required" };
  if (!start_time || !end_time) {
    throw { status: 400, message: "start_time & end_time required" };
  }

  // 🔥 TIME VALIDATION
  if (start_time >= end_time) {
    throw { status: 400, message: "start_time must be less than end_time" };
  }

  // 🔥 AUTO CALCULATE working hours
  const working_hours = calculateHours(start_time, end_time);

  return {
    school_id: Number(school_id),
    name: name.trim().toUpperCase(),
    start_time,
    end_time,
    grace_minutes: grace_minutes ? Number(grace_minutes) : 10,
    working_hours,
    status: status || "active",
  };
};

export const validateUpdateShift = (data) => {
  const cleaned = {};

  if (data.name !== undefined) {
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.start_time && data.end_time) {
    if (data.start_time >= data.end_time) {
      throw { status: 400, message: "Invalid time range" };
    }

    cleaned.start_time = data.start_time;
    cleaned.end_time = data.end_time;
    cleaned.working_hours = calculateHours(data.start_time, data.end_time);
  }

  if (data.grace_minutes !== undefined) {
    cleaned.grace_minutes = Number(data.grace_minutes);
  }

  if (data.status !== undefined) {
    if (!["active", "inactive"].includes(data.status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = data.status;
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

// 🔥 HELPER
const calculateHours = (start, end) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const totalMinutes = eh * 60 + em - (sh * 60 + sm);

  return (totalMinutes / 60).toFixed(2);
};
