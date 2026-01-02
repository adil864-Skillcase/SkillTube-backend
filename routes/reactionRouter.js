import { Router } from "express";
import {
  getReaction,
  likeVideo,
  dislikeVideo,
  getVideoStats,
  getLikedVideos,
} from "../controllers/reactionController.js";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/liked", authMiddleware, getLikedVideos);
router.get("/:videoId", optionalAuth, getReaction);
router.get("/:videoId/stats", getVideoStats);
router.post("/:videoId/like", authMiddleware, likeVideo);
router.post("/:videoId/dislike", authMiddleware, dislikeVideo);

export default router;
