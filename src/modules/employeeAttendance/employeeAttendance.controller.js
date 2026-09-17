import * as Service from "./employeeAttendance.service.js";

export const markManualAttendance = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      marked_by: req.user?.id || req.body.marked_by || null,
    };
    const result = await Service.markManualAttendance(payload);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const checkInAttendance = async (req, res) => {
  try {
    const data = await Service.checkInAttendance(req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const checkOutAttendance = async (req, res) => {
  try {
    const data = await Service.checkOutAttendance(req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const data = await Service.getTodayAttendance(req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const data = await Service.getAllAttendance(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAllAttendanceByToken = async (req, res) => {
  try {
    const data = await Service.getAllAttendanceByToken(req.user, req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const data = await Service.getAttendanceById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAttendanceByFilters = async (req, res) => {
  try {
    const data = await Service.getAttendanceByFilters(req.query, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAttendanceMatrix = async (req, res) => {
  try {
    const data = await Service.getAttendanceMatrix(req.query, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAttendanceByEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const data = await Service.getAttendanceByEmployee(employee_id, req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAttendanceByDateRange = async (req, res) => {
  try {
    const data = await Service.getAttendanceByDateRange(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const result = await Service.updateAttendance(req.params.id, {
      ...req.body,
      marked_by: req.user?.id || req.body.marked_by || null,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const result = await Service.deleteAttendance(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};
