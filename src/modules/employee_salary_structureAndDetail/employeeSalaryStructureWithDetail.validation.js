export const validateCreateStructureWithDetails = (data) => {
  const { employee_id, effective_from, components } = data;

  if (!employee_id) {
    throw { status: 400, message: "employee_id required" };
  }

  if (!effective_from) {
    throw { status: 400, message: "effective_from required" };
  }

  if (!Array.isArray(components) || components.length === 0) {
    throw { status: 400, message: "components required" };
  }

  const cleanedComponents = components.map((c) => {
    if (!c.component_id) {
      throw { status: 400, message: "component_id required" };
    }

    if (!["fixed", "percentage"].includes(c.calculation_type)) {
      throw { status: 400, message: "Invalid calculation_type" };
    }

    let amount = c.amount ?? null;
    let percentage = c.percentage ?? null;

    if (c.calculation_type === "fixed") {
      if (!amount || amount <= 0) {
        throw { status: 400, message: "Valid amount required" };
      }
      percentage = null;
    }

    if (c.calculation_type === "percentage") {
      if (!percentage || percentage <= 0) {
        throw { status: 400, message: "Valid percentage required" };
      }
      amount = null;
    }

    return {
      component_id: Number(c.component_id),
      calculation_type: c.calculation_type,
      amount,
      percentage,
      based_on: c.based_on || "basic",
    };
  });

  return {
    employee_id: Number(employee_id),
    effective_from,
    effective_to: data.effective_to || null,
    remarks: data.remarks || null,
    status: data.status || "active",
    components: cleanedComponents,
  };
};
