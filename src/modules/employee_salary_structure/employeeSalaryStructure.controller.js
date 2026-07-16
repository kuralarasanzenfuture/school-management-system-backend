import * as Service from "./employeeSalaryStructure.service.js";

export const createSalaryStructure = async (req, res) => {
  try {
    const result = await Service.createSalaryStructure(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSalaryStructures = async (req, res) => {
  try {
    const data = await Service.getAllSalaryStructures();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllSalaryStructuresByToken = async (req, res) => {
  try {
    const data = await Service.getAllSalaryStructuresByToken(req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getSalaryStructureById = async (req, res) => {
  try {
    const data = await Service.getSalaryStructureById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateSalaryStructure = async (req, res) => {
  try {
    const result = await Service.updateSalaryStructure(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteSalaryStructure = async (req, res) => {
  try {
    const result = await Service.deleteSalaryStructure(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
