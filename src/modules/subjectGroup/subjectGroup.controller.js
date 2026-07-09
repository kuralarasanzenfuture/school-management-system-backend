import * as SubjectGroupService from "./subjectGroup.service.js";

/* =========================================
   🔴 CREATE
========================================= */
export const createSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.createSubjectGroup(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================================
   🔴 GET ALL
========================================= */
export const getAllSubjectGroups = async (req, res) => {
  try {
    const data = await SubjectGroupService.getAllSubjectGroups();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   🔴 GET BY ID
========================================= */
export const getSubjectGroupById = async (req, res) => {
  try {
    const data = await SubjectGroupService.getSubjectGroupById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================================
   🔴 UPDATE
========================================= */
export const updateSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.updateSubjectGroup(
      req.params.id,
      req.body,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================================
   🔴 DELETE
========================================= */
export const deleteSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.deleteSubjectGroup(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================================
   🔴 GET BY TOKEN (ADMIN / SCHOOL FILTER)
========================================= */
export const getAllSubjectGroupsByToken = async (req, res) => {
  try {
    const data = await SubjectGroupService.getAllSubjectGroupsByToken(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* =========================================
   🔴 CHECK EXISTING (LIKE CLASS CHECK)
========================================= */
export const checkExistingSubjectGroup = async (req, res) => {
  try {
    const result = await SubjectGroupService.checkExistingSubjectGroup(
      req.query,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
