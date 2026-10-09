import { v4 as uuidv4 } from "uuid";
import { auditService } from "../audit/audit.service.js";
import { extractRequestInfo } from "../utils/request.js";

/**
 * Global Audit Middleware
 * - Assigns unique request_id to every incoming request
 * - Populates req.auditInfo with device, IP, and user context
 * - Injects req.audit helper so controllers can easily trigger audits
 */
export const auditMiddleware = (req, res, next) => {
  // Ensure request ID exists
  const requestId = req.headers["x-request-id"] || uuidv4();
  req.id = requestId;
  req.requestId = requestId;

  // Echo request id in response headers for tracing
  res.setHeader("X-Request-Id", requestId);

  // Helper attached to req for easy controller usage:
  // e.g. await req.audit({ action: 'CREATE', module: 'roles', ... })
  req.audit = (params = {}) => {
    return auditService.log({
      req,
      ...params,
    });
  };

  next();
};

export default auditMiddleware;
