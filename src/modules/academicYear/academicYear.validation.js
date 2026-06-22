// export const validateCreateAcademicYear = (data) => {
//   let { school_id, name, start_date, end_date, is_current, status } = data;

//   if (!school_id) {
//     throw { status: 400, message: "school_id is required" };
//   }

//   if (!name) {
//     throw { status: 400, message: "name is required" };
//   }

//   if (!start_date || !end_date) {
//     throw { status: 400, message: "start_date and end_date are required" };
//   }

//   if (new Date(start_date) >= new Date(end_date)) {
//     throw { status: 400, message: "Invalid date range" };
//   }

//   if (status && !["active", "inactive"].includes(status)) {
//     throw { status: 400, message: "Invalid status" };
//   }

//   return {
//     school_id,
//     name: name.trim(),
//     start_date,
//     end_date,
//     is_current: is_current ? 1 : 0,
//     status: status || "active",
//   };
// };

/* -------------- auto-generated name-------------------------------*/

export const validateCreateAcademicYear = (data) => {
  const { school_id, start_date, end_date, is_current, status } = data;

  if (!school_id) {
    throw { status: 400, message: "school_id is required" };
  }

  if (!start_date || !end_date) {
    throw { status: 400, message: "start_date and end_date required" };
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (start >= end) {
    throw { status: 400, message: "start_date must be before end_date" };
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    school_id,
    start_date,
    end_date,
    is_current: is_current || false,
    status: status || "active",
  };
};

export const validateUpdateAcademicYear = (data) => {
  let { name, start_date, end_date, is_current, status } = data;

  if (start_date && end_date) {
    if (new Date(start_date) >= new Date(end_date)) {
      throw { status: 400, message: "Invalid date range" };
    }
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    name,
    start_date,
    end_date,
    is_current,
    status,
  };
};