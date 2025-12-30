import { pool } from "../util/db.js";

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
       (playlist_id, title, description, video_url, thumbnail_url, duration, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        playlistId,
        title,
        description || null,
        videoUrl,
        thumbnailUrl || null,
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
    const { title, description, thumbnailUrl, displayOrder, isActive } =
      req.body;
    const result = await pool.query(
      `UPDATE video 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           display_order = COALESCE($4, display_order),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE video_id = $6
       RETURNING *`,
      [title, description, thumbnailUrl, displayOrder, isActive, id]
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
      "DELETE FROM video WHERE video_id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
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
