export const validateCreate = (data) => {
  const {
    salary_structure_id,
    component_id,
    calculation_type,
    amount,
    percentage,
    based_on,
  } = data;

  if (!salary_structure_id)
    throw { status: 400, message: "salary_structure_id required" };

  if (!component_id) throw { status: 400, message: "component_id required" };

  if (!["fixed", "percentage"].includes(calculation_type)) {
    throw { status: 400, message: "Invalid calculation_type" };
  }

  // 🔥 core logic validation
  if (calculation_type === "fixed") {
    if (amount === undefined || Number(amount) <= 0) {
      throw { status: 400, message: "amount required for fixed type" };
    }
  }

  if (calculation_type === "percentage") {
    if (percentage === undefined || Number(percentage) <= 0) {
      throw { status: 400, message: "percentage required" };
    }
  }

  return {
    salary_structure_id: Number(salary_structure_id),
    component_id: Number(component_id),
    calculation_type,
    amount: calculation_type === "fixed" ? Number(amount) : null,
    percentage: calculation_type === "percentage" ? Number(percentage) : null,
    based_on: based_on || "basic",
  };
};

export const validateUpdate = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  const cleaned = {};

  if (data.calculation_type) {
    if (!["fixed", "percentage"].includes(data.calculation_type)) {
      throw { status: 400, message: "Invalid calculation_type" };
    }
    cleaned.calculation_type = data.calculation_type;
  }

  if (data.amount !== undefined) {
    cleaned.amount = Number(data.amount);
  }

  if (data.percentage !== undefined) {
    cleaned.percentage = Number(data.percentage);
  }

  if (data.based_on !== undefined) {
    if (!["basic", "gross"].includes(data.based_on)) {
      throw { status: 400, message: "Invalid based_on" };
    }
    cleaned.based_on = data.based_on;
  }

  return cleaned;
};
