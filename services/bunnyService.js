import axios from "axios";
import fs from "fs";
import path from "path";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL;

// Upload video to Bunny CDN Storage
export const uploadToBunny = async (filePath, fileName) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/videos/${fileName}`;
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/octet-stream",
      },
    });
    if (response.status === 201) {
      return {
        success: true,
        url: `${BUNNY_CDN_URL}/videos/${fileName}`,
      };
    }
    return { success: false, error: "Upload failed" };
  } catch (err) {
    console.error("Bunny upload error:", err.message);
    return { success: false, error: err.message };
  }
};

// Delete video from Bunny CDN
export const deleteFromBunny = async (fileName) => {
  try {
    const deleteUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/videos/${fileName}`;
    await axios.delete(deleteUrl, {
      headers: {
        AccessKey: BUNNY_API_KEY,
      },
    });
    return { success: true };
  } catch (err) {
    console.error("Bunny delete error:", err.message);
    return { success: false, error: err.message };
  }
};
