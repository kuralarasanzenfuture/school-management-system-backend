// employeeShift.validation.js

export const validateCreateShift = (data) => {
  let {
    school_id,
    name,
    shift_type,
    start_time,
    end_time,
    grace_minutes,
    is_default,
    status,
  } = data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name) throw { status: 400, message: "name required" };
  if (!start_time || !end_time) {
    throw { status: 400, message: "start_time & end_time required" };
  }

  // 🔥 CALCULATE CROSS MIDNIGHT
  const crosses_midnight = start_time >= end_time;

  // 🔥 CALCULATE WORKING HOURS
  const working_hours = calculateHours(start_time, end_time, crosses_midnight);

  return {
    school_id: Number(school_id),
    name: name.trim().toUpperCase(),
    shift_type: shift_type || "day",
    start_time,
    end_time,
    crosses_midnight,
    grace_minutes: grace_minutes ? Number(grace_minutes) : 10,
    working_hours,
    is_default: is_default === true || is_default === "true",
    status: status || "active",
  };
};

// 🔥 HELPER (supports midnight)
const calculateHours = (start, end, crosses) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;

  if (crosses) {
    endMin += 24 * 60; // next day
  }

  const total = endMin - startMin;

  return (total / 60).toFixed(2);
};

export const validateUpdateShift = (data) => {
  const cleaned = {};

  if (data.name !== undefined) {
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.shift_type !== undefined) {
    cleaned.shift_type = data.shift_type;
  }

  if (data.start_time !== undefined) {
    cleaned.start_time = data.start_time;
  }

  if (data.end_time !== undefined) {
    cleaned.end_time = data.end_time;
  }

  // 🔥 If time changes → recalc
  if (data.start_time !== undefined || data.end_time !== undefined) {
    if (!data.start_time || !data.end_time) {
      throw {
        status: 400,
        message: "Both start_time and end_time required",
      };
    }

    const crosses_midnight = data.start_time >= data.end_time;

    const working_hours = calculateHours(
      data.start_time,
      data.end_time,
      crosses_midnight,
    );

    cleaned.crosses_midnight = crosses_midnight;
    cleaned.working_hours = working_hours;
  }

  if (data.grace_minutes !== undefined) {
    cleaned.grace_minutes = Number(data.grace_minutes);
  }

  if (data.is_default !== undefined) {
    cleaned.is_default = data.is_default === true || data.is_default === "true";
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
