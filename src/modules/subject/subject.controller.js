import * as SubjectService from "./subject.service.js";

export const createSubject = async (req, res) => {
  try {
    const result = await SubjectService.createSubject(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const data = await SubjectService.getAllSubjects();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const data = await SubjectService.getSubjectById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const result = await SubjectService.updateSubject(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const result = await SubjectService.deleteSubject(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSubjectsByToken = async (req, res) => {
  try {
    const data = await SubjectService.getAllSubjectsByToken(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const checkExistingSubject = async (req, res) => {
  try {
    const result = await SubjectService.checkExistingSubject(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
