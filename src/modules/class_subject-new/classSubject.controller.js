import * as Service from "./classSubject.service.js";

export const createClassSubject = async (req, res) => {
  try {
    const result = await Service.createClassSubject(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllClassSubjects = async (req, res) => {
  try {
    const data = await Service.getAllClassSubjects();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getClassSubjectById = async (req, res) => {
  try {
    const data = await Service.getClassSubjectById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateClassSubject = async (req, res) => {
  try {
    const result = await Service.updateClassSubject(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteClassSubject = async (req, res) => {
  try {
    const result = await Service.deleteClassSubject(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllClassSubjectsByToken = async (req, res) => {
  try {
    const data = await Service.getAllClassSubjectsByToken(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkExistingClassSubject = async (req, res) => {
  try {
    const result = await Service.checkExistingClassSubject(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllClassSubjectsDetailed = async (req, res) => {
  try {
    const data = await Service.getAllClassSubjectsDetailed(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const bulkAssignSubjects = async (req, res) => {
  try {
    const result = await Service.bulkAssignSubjects(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
