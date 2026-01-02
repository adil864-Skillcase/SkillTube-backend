import { Router } from "express";
import {
  getAllPlaylists,
  getPlaylistBySlug,
  searchPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistsByCategory,
} from "../controllers/playlistController.js";
import {
  authMiddleware,
  authorizeRole,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getAllPlaylists);
router.get("/search", searchPlaylists);
router.get("/category/:categoryId", getPlaylistsByCategory);
router.get("/:slug", getPlaylistBySlug);

// Admin routes
router.post("/", authMiddleware, authorizeRole("admin"), createPlaylist);
router.put("/:id", authMiddleware, authorizeRole("admin"), updatePlaylist);
router.delete("/:id", authMiddleware, authorizeRole("admin"), deletePlaylist);

export default router;
