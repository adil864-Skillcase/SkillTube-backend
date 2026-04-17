import { Router } from "express";
import {
  initVideoUpload,
  completeVideoUpload,
  initThumbnailUpload,
} from "../controllers/uploadController.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

const requireAnyPermission = (keys) => (req, res, next) => {
  if (req.user?.role === "super_admin") {
    return next();
  }
  const available = new Set(req.userPermissions || []);
  if (keys.some((key) => available.has(key))) {
    return next();
  }
  return res.status(403).json({ error: "Permission denied" });
};

router.post("/video/init", requirePermission(PERMISSIONS.VIDEO_CREATE), initVideoUpload);
router.post(
  "/video/complete",
  requirePermission(PERMISSIONS.VIDEO_CREATE),
  completeVideoUpload
);
router.post(
  "/thumbnail/init",
  requireAnyPermission([
    PERMISSIONS.VIDEO_CREATE,
    PERMISSIONS.VIDEO_EDIT,
    PERMISSIONS.PLAYLIST_MANAGE,
  ]),
  initThumbnailUpload
);

export default router;
