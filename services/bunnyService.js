import axios from "axios";
import crypto from "crypto";

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

// Bunny Stream API client
const bunnyStreamApi = axios.create({
  baseURL: `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}`,
  headers: {
    AccessKey: BUNNY_STREAM_API_KEY,
    "Content-Type": "application/json",
  },
});

export const createVideoForUpload = async (title) => {
  try {
    const response = await bunnyStreamApi.post("/videos", { title });
    const video = response.data;

    // Generate TUS upload signature
    const expirationTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const signatureString = `${BUNNY_STREAM_LIBRARY_ID}${BUNNY_STREAM_API_KEY}${expirationTime}${video.guid}`;
    const signature = crypto
      .createHash("sha256")
      .update(signatureString)
      .digest("hex");

    return {
      success: true,
      videoGuid: video.guid,
      libraryId: BUNNY_STREAM_LIBRARY_ID,
      expirationTime,
      signature,
      uploadUrl: `https://video.bunnycdn.com/tusupload`,
    };
  } catch (err) {
    console.error("Create video error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export const uploadVideoFile = async (
  filePath,
  videoGuid,
  signature,
  expirationTime
) => {
  try {
    const fs = await import("fs");
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    // Direct upload to Bunny Stream (not TUS)
    const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`;

    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        AccessKey: BUNNY_STREAM_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return {
      success: true,
      videoGuid,
      url: getPlaybackUrl(videoGuid),
    };
  } catch (err) {
    console.error(
      "Upload error:",
      err.response?.status,
      err.response?.data || err.message
    );
    return { success: false, error: err.message };
  }
};

export const uploadToBunny = async (filePath, fileName) => {
  try {
    // Step 1: Create video entry
    const createResult = await createVideoForUpload(fileName);
    if (!createResult.success) {
      return createResult;
    }

    // Step 2: Upload the actual file
    const uploadResult = await uploadVideoFile(
      filePath,
      createResult.videoGuid,
      createResult.signature,
      createResult.expirationTime
    );

    return uploadResult;
  } catch (err) {
    console.error("Bunny upload error:", err.message);
    return { success: false, error: err.message };
  }
};

export const getVideoDetails = async (videoGuid) => {
  try {
    const response = await bunnyStreamApi.get(`/videos/${videoGuid}`);
    return {
      success: true,
      video: response.data,
    };
  } catch (err) {
    console.error("Get video error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export const updateVideo = async (videoGuid, updates) => {
  try {
    const response = await bunnyStreamApi.post(`/videos/${videoGuid}`, updates);
    return {
      success: true,
      video: response.data,
    };
  } catch (err) {
    console.error("Update video error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export const deleteFromBunny = async (videoGuid) => {
  try {
    await bunnyStreamApi.delete(`/videos/${videoGuid}`);

    return { success: true };
  } catch (err) {
    console.error("Delete video error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export const getPlaybackUrl = (videoGuid) => {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoGuid}/playlist.m3u8`;
};

export const getThumbnailUrl = (videoGuid) => {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoGuid}/thumbnail.jpg`;
};

export const listVideos = async (page = 1, itemsPerPage = 100) => {
  try {
    const response = await bunnyStreamApi.get(`/videos`, {
      params: { page, itemsPerPage },
    });
    return {
      success: true,
      videos: response.data.items,
      totalItems: response.data.totalItems,
      currentPage: response.data.currentPage,
    };
  } catch (err) {
    console.error("List videos error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export default {
  uploadToBunny,
  deleteFromBunny,
  getVideoDetails,
  updateVideo,
  getPlaybackUrl,
  getThumbnailUrl,
  listVideos,
  createVideoForUpload,
  uploadVideoFile,
};
