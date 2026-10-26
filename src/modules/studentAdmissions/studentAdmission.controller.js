import * as AdmissionService from "./studentAdmission.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =====================================
   CREATE ADMISSION
===================================== */
export const createStudentAdmission = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Request body is empty",
      });
    }

    const result = await AdmissionService.createAdmission(req.body, req.user);

    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.STUDENT_ADMISSIONS,
      entity_type: AUDIT_ENTITIES.STUDENT_ADMISSION,
      entity_id: result.data.id,
      entity_name: `Admission #${result.data.admission_number}`,
      school_id: result.data.school_id || req.user?.school_id,
      user_id: req.user?.id,
      description: `Created admission #${result.data.admission_number} for student ${result.data.student_name || result.data.student_id} in class ${result.data.class_name || result.data.class_id}`,
      new_data: result.data,
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error("CREATE ADMISSION ERROR:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.STUDENT_ADMISSIONS,
        entity_type: AUDIT_ENTITIES.STUDENT_ADMISSION,
        school_id: req.user?.school_id,
        user_id: req.user?.id,
        description: `Failed to create admission: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    return res.status(err.status || 500).json({
      message: err.message || "Internal server error",
    });
  }
};

/* =====================================
   GET ALL ADMISSIONS
===================================== */
export const getAllStudentAdmissions = async (req, res) => {
  try {
    const filters = {
      student_id: req.query.student_id,
      class_id: req.query.class_id,
      class_name: req.query.class_name,
      academic_year_id: req.query.academic_year_id,
      academic_year_name: req.query.academic_year_name,
      school_id: req.query.school_id,
      status: req.query.status,
      admission_number: req.query.admission_number,
      subject_group_id: req.query.subject_group_id,
      subject_group: req.query.subject_group,
      class_section_id: req.query.class_section_id,
      section: req.query.section,
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
   GET ALL ADMISSIONS BY TOKEN
===================================== */
export const getAllStudentAdmissionsByToken = async (req, res) => {
  try {
    const filters = {
      student_id: req.query.student_id,
      class_id: req.query.class_id,
      academic_year_id: req.query.academic_year_id,
      school_id: req.query.school_id,
      status: req.query.status,
      admission_number: req.query.admission_number,
      subject_group_id: req.query.subject_group_id,
      subject_group: req.query.subject_group,
      class_section_id: req.query.class_section_id,
      section: req.query.section,
      roll_no: req.query.roll_no,
      admission_type: req.query.admission_type,
      gender: req.query.gender,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
    };

    const data = await AdmissionService.getAllAdmissionsByToken(
      req.user,
      filters,
    );
    res.json(data);
  } catch (err) {
    console.error("GET ALL BY TOKEN ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getClassStudentSummaryByToken = async (req, res) => {
  try {
    const result = await AdmissionService.getClassStudentSummaryByToken(
      req.user,
      req.query,
    );

    res.json(result);
  } catch (err) {
    console.error("GET CLASS SUMMARY ERROR:", err);
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

export const getAllStudentAdmissionsReport = async (req, res) => {
  try {
    const user = req.user;

    const filters = {
      school_id: req.query.school_id,
      academic_year_id: req.query.academic_year_id,
      academic_year_name: req.query.academic_year_name || req.query.academic_year,
      academic_year: req.query.academic_year || req.query.academic_year_name,
      class_id: req.query.class_id,
      class_name: req.query.class_name || req.query.class,
      section: req.query.section,
      admission_type: req.query.admission_type,
      status: req.query.status,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
    };

    const result = await AdmissionService.getAdmissionsReport(user, filters);

    res.status(200).json({
      message: "Report fetched successfully",
      stats: result.stats,
      count: result.admissions ? result.admissions.length : (Array.isArray(result) ? result.length : 0),
      data: result.admissions || result,
    });
  } catch (err) {
    console.error("GET ADMISSIONS REPORT ERROR:", err);
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   GET BY ID
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
   UPDATE ADMISSION
===================================== */
export const updateStudentAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const result = await AdmissionService.updateAdmission(id, req.body, req.user);

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.STUDENT_ADMISSIONS,
      entity_type: AUDIT_ENTITIES.STUDENT_ADMISSION,
      entity_id: id,
      entity_name: `Admission #${result.data?.admission_number || id}`,
      school_id: result.data?.school_id || req.user?.school_id,
      user_id: req.user?.id,
      description: `Updated admission #${result.data?.admission_number || id}`,
      old_data: result.old_data,
      new_data: result.data,
    });

    return res.json(result);
  } catch (err) {
    console.error("UPDATE ERROR:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.STUDENT_ADMISSIONS,
        entity_type: AUDIT_ENTITIES.STUDENT_ADMISSION,
        entity_id: req.params.id,
        school_id: req.user?.school_id,
        user_id: req.user?.id,
        description: `Failed to update admission #${req.params.id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   DELETE ADMISSION
===================================== */
export const deleteStudentAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const result = await AdmissionService.deleteAdmission(id, req.user);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.STUDENT_ADMISSIONS,
      entity_type: AUDIT_ENTITIES.STUDENT_ADMISSION,
      entity_id: id,
      entity_name: `Admission #${result.old_data?.admission_number || id}`,
      school_id: result.old_data?.school_id || req.user?.school_id,
      user_id: req.user?.id,
      description: `Deleted admission #${result.old_data?.admission_number || id}`,
      old_data: result.old_data,
    });

    return res.json(result);
  } catch (err) {
    console.error("DELETE ERROR:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.STUDENT_ADMISSIONS,
        entity_type: AUDIT_ENTITIES.STUDENT_ADMISSION,
        entity_id: req.params.id,
        school_id: req.user?.school_id,
        user_id: req.user?.id,
        description: `Failed to delete admission #${req.params.id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
