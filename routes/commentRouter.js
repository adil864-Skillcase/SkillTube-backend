import { Router } from "express";
import {
  getComments,
  addComment,
  deleteComment,
  getCommentCount,
} from "../controllers/commentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/:videoId", getComments);
router.get("/:videoId/count", getCommentCount);
router.post("/:videoId", authMiddleware, addComment);
router.delete("/:commentId", authMiddleware, deleteComment);

export default router;
