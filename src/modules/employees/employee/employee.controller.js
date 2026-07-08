import * as EmployeeService from "./employee.service.js";

export const createEmployee = async (req, res) => {
  try {
    // console.log("createEmployee req.body:", req.body);
    // console.log("createEmployee req.files:", req.files);
    const result = await EmployeeService.createEmployee(req);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    // console.log("updateEmployee req.body:", req.body);
    // console.log("updateEmployee req.files:", req.files);
    const result = await EmployeeService.updateEmployee(
      req.params.id,
      req
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.deleteEmployee(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployee(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployees();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};