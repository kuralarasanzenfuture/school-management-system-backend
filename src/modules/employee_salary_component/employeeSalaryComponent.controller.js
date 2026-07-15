import * as Service from "./employeeSalaryComponent.service.js";

export const createEmployeeSalaryComponent = async (req, res) => {
  try {
    const data = await Service.createComponent(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllEmployeeSalaryComponents = async (req, res) => {
  try {
    const data = await Service.getAllComponents();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeeSalaryComponentById = async (req, res) => {
  try {
    const data = await Service.getComponentById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEmployeeSalaryComponent = async (req, res) => {
  try {
    const data = await Service.updateComponent(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteEmployeeSalaryComponent = async (req, res) => {
  try {
    const data = await Service.deleteComponent(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkExistingEmployeeSalaryComponent = async (req, res) => {
  try {
    const data = await Service.checkExistingComponent(req.query);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// export const getAllEmployeeSalaryComponentsByToken = async (req, res) => {
//   try {
//     const data = await Service.getComponentsByToken(req.user);
//     res.json(data);
//   } catch (err) {
//     res.status(err.status || 500).json({ message: err.message });
//   }
// };

export const getAllEmployeeSalaryComponentsByToken = async (req, res) => {
  try {
    const data = await Service.getComponentsByToken(req.user, req.query);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
