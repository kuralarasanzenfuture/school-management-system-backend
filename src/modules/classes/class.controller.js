import * as ClassService from "./class.service.js";

export const createClass = async (req, res) => {
  try {
    const result = await ClassService.createClass(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const result = await ClassService.updateClass(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const data = await ClassService.getAllClasses();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllClassesSchoolId = async (req, res) => {
  try {
    const data = await ClassService.getAllClassesSchoolId(req.query.school_id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const data = await ClassService.getClassById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const result = await ClassService.deleteClass(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};