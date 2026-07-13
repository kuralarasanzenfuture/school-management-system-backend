import * as Service from "./employeeShift.service.js";

export const createShift = async (req, res) => {
  try {
    const result = await Service.createShift(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllShifts = async (req, res) => {
  try {
    const data = await Service.getAllShifts(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllShiftsByToken = async (req, res) => {
  try {
    const data = await Service.getAllShiftsByToken(req.user, req.query);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const data = await Service.getShiftById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateShift = async (req, res) => {
  try {
    const result = await Service.updateShift(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteShift = async (req, res) => {
  try {
    const result = await Service.deleteShift(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
