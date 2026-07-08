import * as Service from "./employee_designations.service.js";

export const createEmployeeDesignation = async (req, res) => {
  try {
    const result = await Service.createDesignation(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateEmployeeDesignation = async (req, res) => {
  try {
    const result = await Service.updateDesignation(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteEmployeeDesignation = async (req, res) => {
  try {
    const result = await Service.deleteDesignation(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllEmployeeDesignations = async (req, res) => {
  try {
    const result = await Service.getAllDesignations(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllEmployeeDesignationsByToken = async (req, res) => {
  try {
    const result = await Service.getAllDesignationsByToken(req.user);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getEmployeeDesignationById = async (req, res) => {
  try {
    const result = await Service.getDesignationById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
