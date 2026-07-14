import * as LeaveTypeService from "./employeeLeaveType.service.js";

export const createLeaveType = async (req, res) => {
  try {
    const result = await LeaveTypeService.createLeaveType(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllLeaveTypes = async (req, res) => {
  try {
    const data = await LeaveTypeService.getAllLeaveTypes(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllLeaveTypesByToken = async (req, res) => {
  try {
    const data = await LeaveTypeService.getAllLeaveTypesByToken(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getLeaveTypeById = async (req, res) => {
  try {
    const data = await LeaveTypeService.getLeaveTypeById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const result = await LeaveTypeService.updateLeaveType(
      req.params.id,
      req.body,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteLeaveType = async (req, res) => {
  try {
    const result = await LeaveTypeService.deleteLeaveType(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkExistingLeaveType = async (req, res) => {
  try {
    const result = await LeaveTypeService.checkExistingLeaveType(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
