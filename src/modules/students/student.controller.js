import * as StudentService from "./student.service.js";

export const createStudent = async (req, res) => {
  try {
    // console.log("BODY:", req.body);
    // console.log("FILES:", req.files);
    if (!req.body || Object.keys(req.body).length === 0) {
      throw { status: 400, message: "Request body is empty" };
    }
    const result = await StudentService.createStudent(req);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const data = await StudentService.getAllStudents();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const data = await StudentService.getStudentById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    // console.log("BODY:", req.body);
    // console.log("FILES:", req.files);
    const result = await StudentService.updateStudent(req.params.id, req);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const result = await StudentService.deleteStudent(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
