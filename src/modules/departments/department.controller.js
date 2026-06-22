import * as DepartmentService from "./department.service.js";

export const createDepartment = async (req, res) => {
  try {
    const result = await DepartmentService.createDepartment(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const result = await DepartmentService.updateDepartment(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const data = await DepartmentService.getAllDepartments();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDepartmentsBySchool = async (req, res) => {
  try {
    const data = await DepartmentService.getDepartmentsBySchool(
      req.params.school_id
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const result = await DepartmentService.deleteDepartment(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};