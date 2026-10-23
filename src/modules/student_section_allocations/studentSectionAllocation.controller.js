import * as Service from "./studentSectionAllocation.service.js";
import { auditService } from "../../audit/audit.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_ENTITIES,
} from "../../audit/audit.constants.js";

/* =====================================
   CREATE SECTION ALLOCATION
===================================== */
export const createSectionAllocation = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Request body is empty",
      });
    }

    const result = await Service.createSectionAllocation(req.body, req.user);

    // Audit log for newly created allocation
    await auditService.logCreate({
      req,
      module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
      entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
      entity_id: result.data.id,
      entity_name: `Allocation #${result.data.id} (Student ${result.data.first_name} ${result.data.last_name} -> Section ${result.data.section_name})`,
      school_id: result.data.school_id || req.user?.school_id,
      user_id: req.user?.id,
      description: `Allocated student ${result.data.first_name} ${result.data.last_name} (Admission #${result.data.admission_number}) to section ${result.data.section_name} in class ${result.data.class_name}`,
      new_data: result.data,
    });

    // If previous active allocations were automatically closed/transferred, log each audit record
    if (result.closed_previous_allocations && result.closed_previous_allocations.length > 0) {
      for (const closed of result.closed_previous_allocations) {
        await auditService.log({
          req,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
          entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
          entity_id: closed.id,
          entity_name: `Allocation #${closed.id} (Auto-transferred)`,
          school_id: result.data.school_id || req.user?.school_id,
          user_id: req.user?.id,
          description: `Automatically closed previous section allocation #${closed.id} with effective_to = ${closed.auto_effective_to} upon student transfer to section #${result.data.class_section_id}`,
          new_data: closed,
        });
      }
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error("CREATE SECTION ALLOCATION ERROR:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
        entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
        school_id: req.user?.school_id,
        user_id: req.user?.id,
        description: `Failed to create section allocation: ${err.message}`,
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
   GET ALL SECTION ALLOCATIONS
===================================== */
export const getAllSectionAllocations = async (req, res) => {
  try {
    const filters = {
      admission_id: req.query.admission_id,
      student_id: req.query.student_id,
      class_section_id: req.query.class_section_id,
      class_id: req.query.class_id,
      section_id: req.query.section_id,
      academic_year_id: req.query.academic_year_id,
      school_id: req.query.school_id,
      status: req.query.status,
      active_only: req.query.active_only,
      roll_no: req.query.roll_no,
      gender: req.query.gender,
      allocation_date: req.query.allocation_date,
      search: req.query.search,
    };

    const data = await Service.getAllSectionAllocations(filters, req.user);
    return res.json(data);
  } catch (err) {
    console.error("GET ALL SECTION ALLOCATIONS ERROR:", err);
    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   GET ALL SECTION ALLOCATIONS BY TOKEN
===================================== */
export const getAllSectionAllocationsByToken = async (req, res) => {
  try {
    const filters = {
      admission_id: req.query.admission_id,
      student_id: req.query.student_id,
      class_section_id: req.query.class_section_id,
      class_id: req.query.class_id,
      section_id: req.query.section_id,
      academic_year_id: req.query.academic_year_id,
      school_id: req.query.school_id,
      status: req.query.status,
      active_only: req.query.active_only,
      roll_no: req.query.roll_no,
      gender: req.query.gender,
      allocation_date: req.query.allocation_date,
      search: req.query.search,
    };

    const data = await Service.getAllSectionAllocationsByToken(
      req.user,
      filters,
    );
    return res.json(data);
  } catch (err) {
    console.error("GET ALL SECTION ALLOCATIONS BY TOKEN ERROR:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to fetch section allocations by token",
    });
  }
};

/* =====================================
   CHECK EXISTING SECTION ALLOCATION
===================================== */
export const checkExistingSectionAllocation = async (req, res) => {
  try {
    const data = {
      admission_id: req.query.admission_id || req.body?.admission_id,
      student_id: req.query.student_id || req.body?.student_id,
      class_section_id: req.query.class_section_id || req.body?.class_section_id,
      school_id: req.query.school_id || req.body?.school_id,
      active_only: req.query.active_only !== undefined ? req.query.active_only : true,
    };

    const result = await Service.checkExistingSectionAllocation(data);
    return res.json(result);
  } catch (err) {
    console.error("CHECK ALLOCATION ERROR:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to check section allocation",
    });
  }
};

/* =====================================
   CHECK EXISTING SECTION ALLOCATION BY TOKEN
===================================== */
export const checkExistingSectionAllocationByToken = async (req, res) => {
  try {
    const data = {
      admission_id: req.query.admission_id || req.body?.admission_id,
      student_id: req.query.student_id || req.body?.student_id,
      class_section_id: req.query.class_section_id || req.body?.class_section_id,
      school_id: req.query.school_id || req.body?.school_id,
      active_only: req.query.active_only !== undefined ? req.query.active_only : true,
    };

    const result = await Service.checkExistingSectionAllocationByToken(
      req.user,
      data,
    );
    return res.json(result);
  } catch (err) {
    console.error("CHECK ALLOCATION BY TOKEN ERROR:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to check section allocation by token",
    });
  }
};

/* =====================================
   GET SECTION ALLOCATION BY ID
===================================== */
export const getSectionAllocationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const data = await Service.getSectionAllocationById(id, req.user);
    return res.json(data);
  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =====================================
   UPDATE SECTION ALLOCATION
===================================== */
export const updateSectionAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const result = await Service.updateSectionAllocation(
      id,
      req.body,
      req.user,
    );

    await auditService.logUpdate({
      req,
      module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
      entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
      entity_id: id,
      entity_name: `Allocation #${id}`,
      school_id: result.data?.school_id || req.user?.school_id,
      user_id: req.user?.id,
      description: `Updated section allocation #${id}`,
      old_data: result.old_data,
      new_data: result.data,
    });

    return res.json(result);
  } catch (err) {
    console.error("UPDATE ALLOCATION ERROR:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
        entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
        entity_id: req.params.id,
        school_id: req.user?.school_id,
        user_id: req.user?.id,
        description: `Failed to update section allocation #${req.params.id}: ${err.message}`,
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
   DELETE SECTION ALLOCATION
===================================== */
export const deleteSectionAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID required",
      });
    }

    const result = await Service.deleteSectionAllocation(id, req.user);

    await auditService.logDelete({
      req,
      module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
      entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
      entity_id: id,
      entity_name: `Allocation #${id}`,
      school_id: result.old_data?.school_id || req.user?.school_id,
      user_id: req.user?.id,
      description: `Deleted section allocation #${id}`,
      old_data: result.old_data,
    });

    return res.json(result);
  } catch (err) {
    console.error("DELETE ALLOCATION ERROR:", err);

    if (err.status && err.status !== 500) {
      await auditService.log({
        req,
        action: AUDIT_ACTIONS.DELETE,
        module: AUDIT_MODULES.STUDENT_SECTION_ALLOCATIONS,
        entity_type: AUDIT_ENTITIES.STUDENT_SECTION_ALLOCATION,
        entity_id: req.params.id,
        school_id: req.user?.school_id,
        user_id: req.user?.id,
        description: `Failed to delete section allocation #${req.params.id}: ${err.message}`,
        status: "failed",
        error_message: err.message,
      });
    }

    return res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
