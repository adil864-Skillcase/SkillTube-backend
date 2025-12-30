import cloudinary from "../config/cloudinary.js";

// Upload thumbnail to Cloudinary
export const uploadThumbnail = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "skilltube/thumbnails",
      transformation: [
        { width: 720, height: 1280, crop: "fill" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
    return { success: false, error: err.message };
  }
};

// Delete thumbnail from Cloudinary
export const deleteThumbnail = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
    return { success: false, error: err.message };
  }
};
