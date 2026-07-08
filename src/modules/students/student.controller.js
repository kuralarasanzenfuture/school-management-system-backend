import * as StudentService from "./student.service.js";

export const createStudent = async (req, res) => {
  try {
    // console.log("BODY:", req.body);
    // console.log("FILES:", req.files);

    // console.table({ ...req.body });

    // if (req.files) {
    //   console.table(
    //     Object.keys(req.files).map((key) => ({
    //       field: key,
    //       count: req.files[key].length,
    //       file: req.files[key][0]?.filename,
    //     }))
    //   );
    // }

    if (!req.body || Object.keys(req.body).length === 0) {
      throw { status: 400, message: "Request body is empty" };
    }
    const result = await StudentService.createStudent(req);
    res.status(201).json(result);
  } catch (err) {
    console.error("CREATE STUDENT ERROR:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const data = await StudentService.getAllStudents();
    res.json(data);
  } catch (err) {
    console.error("GET ALL STUDENTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllStudentsByToken = async (req, res) => {
  try {
    const data = await StudentService.getAllStudentsByToken(req.user);
    res.json(data);
  } catch (err) {
    console.error("GET ALL STUDENTS BY TOKEN ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const data = await StudentService.getStudentById(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("GET STUDENT BY ID ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    // console.table({ ...req.body });

    // if (req.files) {
    //   console.table(
    //     Object.keys(req.files).map((key) => ({
    //       field: key,
    //       count: req.files[key].length,
    //       file: req.files[key][0]?.filename,
    //     })),
    //   );
    // }

    const result = await StudentService.updateStudent(req.params.id, req);
    res.json(result);
  } catch (err) {
    console.error("UPDATE STUDENT ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const result = await StudentService.deleteStudent(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("DELETE STUDENT ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};
