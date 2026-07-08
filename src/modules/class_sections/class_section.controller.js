import * as ClassSectionService from "./class_section.service.js";

export const createClassSection = async (req, res) => {
  try {
    const result = await ClassSectionService.createClassSection(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllClassSections = async (req, res) => {
  try {
    const data = await ClassSectionService.getAllClassSections();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getClassSectionById = async (req, res) => {
  try {
    const data = await ClassSectionService.getClassSectionById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateClassSection = async (req, res) => {
  try {
    const result = await ClassSectionService.updateClassSection(
      req.params.id,
      req.body,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteClassSection = async (req, res) => {
  try {
    const result = await ClassSectionService.deleteClassSection(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
