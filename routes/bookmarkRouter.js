import { Router } from "express";
import {
  getBookmarks,
  toggleBookmark,
  checkBookmark,
} from "../controllers/bookmarkController.js";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getBookmarks);
router.get("/:videoId/check", optionalAuth, checkBookmark);
router.post("/:videoId", authMiddleware, toggleBookmark);

export default router;
