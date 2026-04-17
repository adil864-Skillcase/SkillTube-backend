import { Router } from "express";
import {
  getAllPlaylists,
  getAllPlaylistsAdmin,
  getPlaylistBySlug,
  searchPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistsByCategory,
} from "../controllers/playlistController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { attachPermissions, requirePermission } from "../middlewares/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

// Public routes
router.get("/", getAllPlaylists);
router.get("/search", searchPlaylists);
router.get("/category/:categoryId", getPlaylistsByCategory);
// Admin-only: returns all playlists including inactive (used by admin dropdowns)
router.get("/admin/all", authMiddleware, attachPermissions, getAllPlaylistsAdmin);
router.get("/:slug", getPlaylistBySlug);

// Admin mutation routes
router.post(
  "/",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.PLAYLIST_MANAGE),
  createPlaylist
);
router.put(
  "/:id",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.PLAYLIST_MANAGE),
  updatePlaylist
);
router.delete(
  "/:id",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.PLAYLIST_MANAGE),
  deletePlaylist
);

export default router;
