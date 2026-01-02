import { pool } from "../util/db.js";
import { deleteFromBunny } from "../services/bunnyService.js";

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
      thumbnailUrl,
      category,
      duration,
      displayOrder,
    } = req.body;
    if (!playlistId || !title || !videoUrl) {
      return res.status(400).json({
        error: "Playlist ID, title, and video URL are required",
      });
    }
    const result = await pool.query(
      `INSERT INTO video 
       (playlist_id, title, description, video_url, thumbnail_url, category, duration, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        playlistId,
        title,
        description || null,
        videoUrl,
        thumbnailUrl || null,
        category || null,
        duration || 0,
        displayOrder || 0,
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
    const { title, description, thumbnailUrl, category, displayOrder, isActive } =
      req.body;
    const result = await pool.query(
      `UPDATE video 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           category = COALESCE($4, category),
           display_order = COALESCE($5, display_order),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE video_id = $7
       RETURNING *`,
      [title, description, thumbnailUrl, category, displayOrder, isActive, id]
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

    // Get video URL before delete
    const video = await pool.query(
      "SELECT video_url FROM video WHERE video_id = $1",
      [id]
    );

    if (video.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Delete from database
    await pool.query("DELETE FROM video WHERE video_id = $1", [id]);

    // Delete from Bunny CDN (optional, fire-and-forget)
    const videoUrl = video.rows[0].video_url;
    if (videoUrl) {
      const filename = videoUrl.split("/").pop();
      deleteFromBunny(filename).catch(console.error);
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
       WHERE v.is_active = TRUE AND v.category = $1
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
