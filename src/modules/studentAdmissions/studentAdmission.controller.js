import * as AdmissionService from "./studentAdmission.service.js";

/* =====================================
   🔴 CREATE ADMISSION
===================================== */
export const createStudentAdmission = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Request body is empty",
      });
    }

    const result = await AdmissionService.createAdmission(req.body);

    return res.status(201).json(result);
  } catch (err) {
    console.error("CREATE ADMISSION ERROR:", err);

    return res.status(err.status || 500).json({
      message: err.message || "Internal server error",
    });
  }
};

/* =====================================
   🔴 GET ALL ADMISSIONS
===================================== */
export const getAllStudentAdmissions = async (req, res) => {
  try {
    const filters = {
      student_id: req.query.student_id,
      class_id: req.query.class_id,
      academic_year_id: req.query.academic_year_id,
    };

    const data = await AdmissionService.getAllAdmissions(filters);

    return res.json(data);
  } catch (err) {
    console.error("GET ALL ERROR:", err);

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   🔴 GET BY ID
===================================== */
export const getStudentAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const data = await AdmissionService.getAdmissionById(id);

    return res.json(data);
  } catch (err) {
    console.error("GET BY ID ERROR:", err);

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   🔴 UPDATE ADMISSION
===================================== */
export const updateStudentAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const result = await AdmissionService.updateAdmission(id, req.body);

    return res.json(result);
  } catch (err) {
    console.error("UPDATE ERROR:", err);

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   🔴 DELETE ADMISSION
===================================== */
export const deleteStudentAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const result = await AdmissionService.deleteAdmission(id);

    return res.json(result);
  } catch (err) {
    console.error("DELETE ERROR:", err);

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
