import { Router } from "express";
import {
  getReaction,
  likeVideo,
  dislikeVideo,
  getVideoStats,
} from "../controllers/reactionController.js";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/:videoId", optionalAuth, getReaction);
router.get("/:videoId/stats", getVideoStats);
router.post("/:videoId/like", authMiddleware, likeVideo);
router.post("/:videoId/dislike", authMiddleware, dislikeVideo);

export default router;
