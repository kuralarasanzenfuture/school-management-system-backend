import * as Service from "./studentAttendance.service.js";

/* ===========================
   MARK ATTENDANCE
=========================== */
export const markAttendance = async (req, res) => {
  try {
    const result = await Service.markAttendance(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   GET ALL ATTENDANCE
=========================== */
export const getAllAttendance = async (req, res) => {
  try {
    const result = await Service.getAllAttendance(req.query);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   GET ALL BY TOKEN
=========================== */
export const getAllAttendanceByToken = async (req, res) => {
  try {
    const result = await Service.getAllAttendanceByToken(req.user, req.query);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   GET BY SESSION ID
=========================== */
export const getAttendanceBySession = async (req, res) => {
  try {
    const result = await Service.getAttendanceBySession(
      req.params.session_id,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   GET BY ID
=========================== */
export const getAttendanceById = async (req, res) => {
  try {
    const result = await Service.getAttendanceById(req.params.id);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   GET BY STUDENT
=========================== */
export const getAttendanceByStudentId = async (req, res) => {
  try {
    const result = await Service.getAttendanceByStudent(
      req.params.admission_id,
      req.query,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   GET BY DATE
=========================== */
export const getAttendanceByDate = async (req, res) => {
  try {
    const result = await Service.getAttendanceByDate(req.query);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   UPDATE ATTENDANCE
=========================== */
export const updateAttendance = async (req, res) => {
  try {
    const result = await Service.updateAttendance(
      req.params.id,
      req.body,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   DELETE ATTENDANCE
=========================== */
export const deleteAttendance = async (req, res) => {
  try {
    const result = await Service.deleteAttendance(req.params.id);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   LOCK SESSION
=========================== */
export const lockAttendanceSession = async (req, res) => {
  try {
    const result = await Service.lockAttendanceSession(
      req.params.session_id,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   UNLOCK SESSION
=========================== */
export const unlockAttendanceSession = async (req, res) => {
  try {
    const result = await Service.unlockAttendanceSession(
      req.params.session_id,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* ===========================
   ATTENDANCE SUMMARY
=========================== */
export const getAttendanceSummary = async (req, res) => {
  try {
    const result = await Service.getAttendanceSummary(req.query);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
