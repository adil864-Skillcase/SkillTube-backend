import { Router } from "express";
import {
  getAdminPermissions,
  grantAdminPermission,
  revokeAdminPermission,
} from "../controllers/adminPermissionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  attachPermissions,
  requirePermission,
} from "../middlewares/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authMiddleware, attachPermissions);

router.get(
  "/",
  requirePermission(PERMISSIONS.ADMIN_MANAGE_PERMISSIONS),
  getAdminPermissions
);
router.post(
  "/grant",
  requirePermission(PERMISSIONS.ADMIN_MANAGE_PERMISSIONS),
  grantAdminPermission
);
router.post(
  "/revoke",
  requirePermission(PERMISSIONS.ADMIN_MANAGE_PERMISSIONS),
  revokeAdminPermission
);

export default router;
