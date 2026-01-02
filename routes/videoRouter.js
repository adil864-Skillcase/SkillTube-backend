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
  authorizeRole,
} from "../middlewares/authMiddleware.js";

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
router.post("/", authMiddleware, authorizeRole("admin"), createVideo);
router.put("/:id", authMiddleware, authorizeRole("admin"), updateVideo);
router.delete("/:id", authMiddleware, authorizeRole("admin"), deleteVideo);

export default router;
