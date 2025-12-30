import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { uploadToBunny } from "../services/bunnyService.js";
import { uploadThumbnail } from "../services/cloudinaryService.js";

// Configure multer for temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./tmp/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video") {
      const videoTypes = /mp4|mov|avi|mkv|webm/;
      const extname = videoTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error("Only video files are allowed"));
      }
    } else if (file.fieldname === "thumbnail") {
      const imageTypes = /jpeg|jpg|png|webp/;
      const extname = imageTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    } else {
      cb(null, true);
    }
  },
});

// Upload video to Bunny CDN
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }
    const result = await uploadToBunny(req.file.path, req.file.filename);
    // Clean up temp file
    fs.unlinkSync(req.file.path);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({
      success: true,
      videoUrl: result.url,
    });
  } catch (err) {
    console.error("Upload video error:", err);
    res.status(500).json({ error: "Failed to upload video" });
  }
};

// Upload thumbnail to Cloudinary
export const uploadThumbnailController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No thumbnail file provided" });
    }
    const result = await uploadThumbnail(req.file.path);
    // Clean up temp file
    fs.unlinkSync(req.file.path);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({
      success: true,
      thumbnailUrl: result.url,
    });
  } catch (err) {
    console.error("Upload thumbnail error:", err);
    res.status(500).json({ error: "Failed to upload thumbnail" });
  }
};
