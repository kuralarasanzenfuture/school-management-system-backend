import { auditService } from "../../audit/audit.service.js";

export const getAuditLogs = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      // If user is not superadmin/admin, restrict to their school
      school_id: req.user?.roles?.includes("ADMIN") ? req.query.school_id : req.user?.school_id,
    };

    const result = await auditService.getLogs(filters);

    res.setHeader("X-Total-Count", result.total);
    res.setHeader("X-Page", result.page);
    res.setHeader("X-Limit", result.limit);
    res.setHeader("X-Total-Pages", result.totalPages);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch audit logs",
    });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const log = await auditService.getLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: "Audit log not found" });
    }

    res.json({ success: true, data: log });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch audit log details",
    });
  }
};
