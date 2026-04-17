import { Router } from "express";
import {
  getVideosByPlaylist,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementViewCount,
  getLatestVideos,
  searchVideos,
  getVideosByCategory,
  getAllVideos,
} from "../controllers/videoController.js";
import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";
import { attachPermissions, requirePermission } from "../middlewares/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

// User routes
router.get("/", getAllVideos);
router.get("/latest", getLatestVideos);
router.get("/search", searchVideos);
router.get("/category/:categoryId", getVideosByCategory);
router.get("/playlist/:playlistId", getVideosByPlaylist);
router.get("/:id", getVideoById);
router.post("/:id/view", incrementViewCount);

// Admin routes
router.post(
  "/",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.VIDEO_CREATE),
  createVideo
);
router.put(
  "/:id",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.VIDEO_EDIT),
  updateVideo
);
router.delete(
  "/:id",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.VIDEO_DELETE),
  deleteVideo
);

export default router;
