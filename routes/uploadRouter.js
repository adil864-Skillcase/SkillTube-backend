import { Router } from "express";
import {
  upload,
  uploadVideo,
  uploadThumbnailController,
} from "../controllers/uploadController.js";

const router = Router();

router.post("/video", upload.single("video"), uploadVideo);
router.post(
  "/thumbnail",
  upload.single("thumbnail"),
  uploadThumbnailController
);

export default router;
