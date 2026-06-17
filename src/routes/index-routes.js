import express from "express";
import roleRoutes from "./roles/roles.routes.js";
import userRoutes from "./users/users.routes.js";

const router = express.Router();


router.use("/roles", roleRoutes);
router.use("/users", userRoutes);


export default router;
