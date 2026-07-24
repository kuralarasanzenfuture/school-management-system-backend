import * as Service from "./employeeSalaryStructureDetail.service.js";

export const createSalaryStructureDetail = async (req, res) => {
  try {
    const result = await Service.createSalaryStructureDetail(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const bulkUpsertSalaryStructureDetails = async (req, res) => {
  try {
    const result = await Service.bulkUpsertSalaryStructureDetails(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSalaryStructureDetails = async (req, res) => {
  try {
    const data = await Service.getAllSalaryStructureDetails();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSalaryStructureDetailsByToken = async (req, res) => {
  try {
    const data = await Service.getAllSalaryStructureDetailsByToken(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getSalaryStructureDetailById = async (req, res) => {
  try {
    const data = await Service.getSalaryStructureDetailById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateSalaryStructureDetail = async (req, res) => {
  try {
    const result = await Service.updateSalaryStructureDetail(
      req.params.id,
      req.body,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteSalaryStructureDetail = async (req, res) => {
  try {
    const result = await Service.deleteSalaryStructureDetail(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const calculateSalaryByEmployeeId = async (req, res) => {
  try {
    const result = await Service.calculateSalary(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getFullSalaryByEmployeeId = async (req, res) => {
  try {
    const employee_id = req.params.employee_id;

    if (!employee_id) {
      return res.status(400).json({ message: "employee_id required" });
    }

    const result = await Service.getFullSalaryByEmployee(employee_id);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
