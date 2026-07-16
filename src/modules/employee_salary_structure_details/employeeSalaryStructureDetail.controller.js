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
