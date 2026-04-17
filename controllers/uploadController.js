import {
  buildThumbnailObjectKey,
  buildVideoObjectKey,
  checkObjectExists,
  createPutObjectContract,
} from "../services/s3Service.js";
import {
  buildHlsManifestPath,
  createTranscodeJob,
} from "../services/mediaConvertService.js";
import { getCloudFrontUrl } from "../services/assetUrlService.js";

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;

export const initVideoUpload = async (req, res) => {
  try {
    const { fileName, contentType, fileSize } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: "fileName and contentType are required" });
    }

    if (fileSize && Number(fileSize) > MAX_UPLOAD_SIZE) {
      return res.status(400).json({ error: "Video exceeds 500MB limit" });
    }

    const objectKey = buildVideoObjectKey(fileName);
    const contract = await createPutObjectContract({
      key: objectKey,
      contentType,
    });

    res.json({
      success: true,
      ...contract,
      objectKey,
    });
  } catch (err) {
    console.error("Init video upload error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Failed to initialize upload" });
  }
};

export const completeVideoUpload = async (req, res) => {
  try {
    const { objectKey } = req.body;
    if (!objectKey) {
      return res.status(400).json({ error: "objectKey is required" });
    }

    const exists = await checkObjectExists(objectKey);
    if (!exists) {
      return res.status(400).json({ error: "Uploaded file not found in storage" });
    }

    const hlsManifestPath = buildHlsManifestPath(objectKey);
    const transcodeResult = await createTranscodeJob({ sourceKey: objectKey });

    res.json({
      success: true,
      objectKey,
      hlsManifestPath,
      jobId: transcodeResult.jobId || null,
      processingStatus: transcodeResult.queued ? "processing" : "uploaded",
      videoUrl: getCloudFrontUrl(objectKey),
    });
  } catch (err) {
    console.error("Complete video upload error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Failed to complete upload" });
  }
};

export const initThumbnailUpload = async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: "fileName and contentType are required" });
    }

    const objectKey = buildThumbnailObjectKey(fileName);
    const contract = await createPutObjectContract({
      key: objectKey,
      contentType,
    });

    res.json({
      success: true,
      ...contract,
      objectKey,
      thumbnailUrl: getCloudFrontUrl(objectKey),
    });
  } catch (err) {
    console.error("Init thumbnail upload error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Failed to initialize thumbnail upload" });
  }
};
