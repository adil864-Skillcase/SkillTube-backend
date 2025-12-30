import { Router } from "express";
import {
  getVideosByPlaylist,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementViewCount,
} from "../controllers/videoController.js";
import {
  authMiddleware,
  authorizeRole,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/playlist/:playlistId", getVideosByPlaylist);
router.get("/:id", getVideoById);
router.post("/:id/view", incrementViewCount);

// Admin routes
router.post("/", authMiddleware, authorizeRole("admin"), createVideo);
router.put("/:id", authMiddleware, authorizeRole("admin"), updateVideo);
router.delete("/:id", authMiddleware, authorizeRole("admin"), deleteVideo);

export default router;
