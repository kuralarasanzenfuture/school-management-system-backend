import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  updateRoleStatus,
  checkExistingRoleName,
} from "./role.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createRole);
router.get("/", getAllRoles);
router.get("/check-name", checkExistingRoleName);
router.get("/check-name/:name", checkExistingRoleName);
router.get("/check-existing", checkExistingRoleName);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);
router.patch("/status/:id", updateRoleStatus);
router.delete("/:id", deleteRole);

export default router;