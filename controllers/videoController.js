import { pool } from "../util/db.js";
import { getCloudFrontUrl } from "../services/assetUrlService.js";

// Get videos by playlist
export const getVideosByPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const result = await pool.query(
      `SELECT * FROM video 
       WHERE playlist_id = $1 AND is_active = TRUE 
       ORDER BY display_order ASC, created_at DESC`,
      [playlistId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get videos error:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// Get single video
export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM video WHERE video_id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get video error:", err);
    res.status(500).json({ error: "Failed to fetch video" });
  }
};

// Create video (admin)
export const createVideo = async (req, res) => {
  try {
    const {
      playlistId,
      title,
      description,
      videoUrl,
      storageKey,
      hlsManifestPath,
      thumbnailUrl,
      thumbnailKey,
      category,
      categoryId,
      duration,
      displayOrder,
      processingStatus,
      sourceType,
    } = req.body;
    if (!playlistId || !title || (!videoUrl && !hlsManifestPath && !storageKey)) {
      return res.status(400).json({
        error: "Playlist ID, title and one media source are required",
      });
    }

    const resolvedVideoUrl =
      videoUrl ||
      (hlsManifestPath ? getCloudFrontUrl(hlsManifestPath) : null) ||
      (storageKey ? getCloudFrontUrl(storageKey) : null);

    const result = await pool.query(
      `INSERT INTO video 
       (playlist_id, title, description, video_url, storage_key, hls_manifest_path, thumbnail_url, thumbnail_key, category, category_id, duration, display_order, processing_status, source_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        playlistId,
        title,
        description || null,
        resolvedVideoUrl,
        storageKey || null,
        hlsManifestPath || null,
        thumbnailUrl || null,
        thumbnailKey || null,
        category || null,
        categoryId || null,
        duration || 0,
        displayOrder || 0,
        processingStatus || "processing",
        sourceType || "hls",
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create video error:", err);
    res.status(500).json({ error: "Failed to create video" });
  }
};

// Update video (admin)
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      thumbnailUrl,
      thumbnailKey,
      category,
      categoryId,
      displayOrder,
      isActive,
      processingStatus,
      videoUrl,
      hlsManifestPath,
      playlistId,
    } = req.body;

    const resolvedVideoUrl =
      videoUrl || (hlsManifestPath ? getCloudFrontUrl(hlsManifestPath) : null);

    const result = await pool.query(
      `UPDATE video 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           thumbnail_key = COALESCE($4, thumbnail_key),
           category = COALESCE($5, category),
           category_id = COALESCE($6, category_id),
           display_order = COALESCE($7, display_order),
           is_active = COALESCE($8, is_active),
           processing_status = COALESCE($9, processing_status),
           hls_manifest_path = COALESCE($10, hls_manifest_path),
           video_url = COALESCE($11, video_url),
           playlist_id = COALESCE($12, playlist_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE video_id = $13
       RETURNING *`,
      [
        title,
        description,
        thumbnailUrl,
        thumbnailKey,
        category,
        categoryId,
        displayOrder,
        isActive,
        processingStatus,
        hlsManifestPath,
        resolvedVideoUrl,
        playlistId,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update video error:", err);
    res.status(500).json({ error: "Failed to update video" });
  }
};

// Delete video (admin)
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM video WHERE video_id = $1 RETURNING video_id",
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    console.error("Delete video error:", err);
    res.status(500).json({ error: "Failed to delete video" });
  }
};

// Increment view count
export const incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE video SET view_count = view_count + 1 WHERE video_id = $1",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Increment view error:", err);
    res.status(500).json({ error: "Failed to update view count" });
  }
};

// Get latest videos
export const getLatestVideos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT v.*, p.name as playlist_name, p.slug as playlist_slug 
       FROM video v 
       JOIN playlist p ON v.playlist_id = p.playlist_id 
       WHERE v.is_active = TRUE 
       ORDER BY v.created_at DESC 
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get latest videos error:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// Search videos
export const searchVideos = async (req, res) => {
  try {
    const query = req.query.q || "";

    const result = await pool.query(
      `SELECT v.*, p.name as playlist_name, p.slug as playlist_slug 
       FROM video v 
       JOIN playlist p ON v.playlist_id = p.playlist_id 
       WHERE v.is_active = TRUE 
       AND (v.title ILIKE $1 OR v.description ILIKE $1 OR p.name ILIKE $1)
       ORDER BY v.created_at DESC 
       LIMIT 30`,
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Search videos error:", err);
    res.status(500).json({ error: "Failed to search" });
  }
};

// Get videos by category (for Top 10 section)
export const getVideosByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT v.*, p.name as playlist_name, p.slug as playlist_slug 
       FROM video v 
       JOIN playlist p ON v.playlist_id = p.playlist_id 
       LEFT JOIN category c ON c.category_id = v.category_id
       WHERE v.is_active = TRUE
         AND (
           c.slug = $1
           OR v.category = $1
           OR CAST(v.category_id AS TEXT) = $1
         )
       ORDER BY v.view_count DESC, v.created_at DESC 
       LIMIT $2`,
      [categoryId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get videos by category error:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// Get all videos (admin)
export const getAllVideos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, p.name as playlist_name, p.slug as playlist_slug 
       FROM video v 
       JOIN playlist p ON v.playlist_id = p.playlist_id 
       ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get all videos error:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};
