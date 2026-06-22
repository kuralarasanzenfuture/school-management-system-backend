import * as AcademicYearService from "./academicYear.service.js";

export const createAcademicYear = async (req, res) => {
  try {
    const result = await AcademicYearService.createAcademicYear(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateAcademicYear = async (req, res) => {
  try {
    const result = await AcademicYearService.updateAcademicYear(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllAcademicYears = async (req, res) => {
  try {
    const school_id = req.query.school_id;

    const data = await AcademicYearService.getAllAcademicYears(school_id);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAcademicYearById = async (req, res) => {
  try {
    const data = await AcademicYearService.getAcademicYearById(
      req.params.id
    );

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

export const deleteAcademicYear = async (req, res) => {
  try {
    const result = await AcademicYearService.deleteAcademicYear(
      req.params.id
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
