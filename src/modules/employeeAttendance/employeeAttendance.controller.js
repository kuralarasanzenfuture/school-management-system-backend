import * as Service from "./employeeAttendance.service.js";
export const markManualAttendance = async (req, res) => {
  try {
    const result = await Service.markManualAttendance(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const data = await Service.getAllAttendance(req.query);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllAttendanceByToken = async (req, res) => {
  try {
    const data = await Service.getAllAttendanceByToken(req.user, req.query);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const data = await Service.getAttendanceById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAttendanceByEmployee = async (req, res) => {
  try {
    const data = await Service.getAttendanceByEmployee(req.params.employee_id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAttendanceByDateRange = async (req, res) => {
  try {
    const data = await Service.getAttendanceByDateRange(req.query);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const result = await Service.updateAttendance(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const result = await Service.deleteAttendance(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
