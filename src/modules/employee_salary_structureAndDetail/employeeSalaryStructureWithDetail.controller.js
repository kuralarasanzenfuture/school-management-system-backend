import * as Service from "./employeeSalaryStructureWithDetail.service";

export const createSalaryStructureWithDetails = async (req, res) => {
  try {
    const result = await Service.createSalaryStructureWithDetails(
      req.body,
      req.user
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};