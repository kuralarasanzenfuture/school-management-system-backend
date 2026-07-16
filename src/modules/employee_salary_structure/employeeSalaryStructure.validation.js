// export const validateCreate = (data) => {
//   const { employee_id, effective_from } = data;

//   if (!employee_id) {
//     throw { status: 400, message: "employee_id required" };
//   }

//   if (!effective_from) {
//     throw { status: 400, message: "effective_from required" };
//   }

//   return {
//     employee_id: Number(employee_id),
//     effective_from,
//     effective_to: data.effective_to || null,
//     remarks: data.remarks || null,
//     status: data.status || "active",
//     created_by: data.created_by || null,
//   };
// };

export const validateCreate = (data) => {
  const { employee_id, effective_from } = data;

  if (!employee_id) {
    throw { status: 400, message: "employee_id required" };
  }

  if (!effective_from) {
    throw { status: 400, message: "effective_from required" };
  }

  return {
    employee_id: Number(employee_id),
    effective_from,
    effective_to: data.effective_to || null,
    remarks: data.remarks || null,
    status: data.status || "active",
  };
};

export const validateUpdate = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  const cleaned = {};

  if (data.effective_from !== undefined) {
    cleaned.effective_from = data.effective_from;
  }

  if (data.effective_to !== undefined) {
    cleaned.effective_to = data.effective_to;
  }

  if (data.status !== undefined) {
    if (!["active", "inactive"].includes(data.status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = data.status;
  }

  if (data.remarks !== undefined) {
    cleaned.remarks = data.remarks || null;
  }

  return cleaned;
};
