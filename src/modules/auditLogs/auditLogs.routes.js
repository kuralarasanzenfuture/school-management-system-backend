import express from "express";
import { getAuditLogs, getAuditLogById } from "./auditLogs.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getAuditLogs);
router.get("/:id", getAuditLogById);

export default router;
