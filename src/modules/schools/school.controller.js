import * as SchoolService from "./school.service.js";

export const createSchool = async (req, res) => {
  try {
    const result = await SchoolService.createSchool(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSchools = async (req, res) => {
  try {
    const data = await SchoolService.getAllSchools();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const data = await SchoolService.getSchoolById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const result = await SchoolService.updateSchool(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const result = await SchoolService.deleteSchool(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};