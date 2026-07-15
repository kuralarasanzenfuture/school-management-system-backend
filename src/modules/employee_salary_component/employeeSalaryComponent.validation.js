import { parseBoolean } from "../../utils/toBoolean.js";

export const validateCreate = (data) => {
  const { school_id, name, code, component_type, calculation_type, status } =
    data;

  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!name || !name.trim()) throw { status: 400, message: "name required" };
  if (!code || !code.trim()) throw { status: 400, message: "code required" };
  if (!component_type)
    throw { status: 400, message: "component_type required" };

  if (!["earning", "deduction"].includes(component_type)) {
    throw { status: 400, message: "Invalid component_type" };
  }

  const cleaned = {
    school_id: Number(school_id),
    name: name.trim().toUpperCase(),
    code: code.trim().toUpperCase(),

    component_type,
    calculation_type: calculation_type || "fixed",
    status: status || "active",
  };

  if (!["fixed", "percentage"].includes(cleaned.calculation_type)) {
    throw { status: 400, message: "Invalid calculation_type" };
  }

  if (!["active", "inactive"].includes(cleaned.status)) {
    throw { status: 400, message: "Invalid status" };
  }

  // 🔥 strong code format
  if (!/^[A-Z0-9_]+$/.test(cleaned.code)) {
    throw { status: 400, message: "Invalid code format" };
  }

  return cleaned;
};

export const validateUpdate = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  const cleaned = {};

  if (data.name !== undefined) {
    if (!data.name.trim())
      throw { status: 400, message: "name cannot be empty" };
    cleaned.name = data.name.trim().toUpperCase();
  }

  if (data.code !== undefined) {
    if (!data.code.trim())
      throw { status: 400, message: "code cannot be empty" };
    cleaned.code = data.code.trim().toUpperCase();

    if (!/^[A-Z0-9_]+$/.test(cleaned.code)) {
      throw { status: 400, message: "Invalid code format" };
    }
  }

  if (data.component_type !== undefined) {
    if (!["earning", "deduction"].includes(data.component_type)) {
      throw { status: 400, message: "Invalid component_type" };
    }
    cleaned.component_type = data.component_type;
  }

  if (data.calculation_type !== undefined) {
    if (!["fixed", "percentage"].includes(data.calculation_type)) {
      throw { status: 400, message: "Invalid calculation_type" };
    }
    cleaned.calculation_type = data.calculation_type;
  }

  if (data.status !== undefined) {
    if (!["active", "inactive"].includes(data.status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = data.status;
  }

  return cleaned;
};
