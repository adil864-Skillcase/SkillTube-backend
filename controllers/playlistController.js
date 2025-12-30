import { pool } from "../util/db.js";

// Get all playlists
export const getAllPlaylists = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COUNT(v.video_id) as video_count
      FROM playlist p
      LEFT JOIN video v ON p.playlist_id = v.playlist_id AND v.is_active = TRUE
      WHERE p.is_active = TRUE
      GROUP BY p.playlist_id
      ORDER BY p.display_order ASC, p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Get playlists error:", err);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
};

// Get playlist by slug with videos
export const getPlaylistBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const playlistResult = await pool.query(
      "SELECT * FROM playlist WHERE slug = $1 AND is_active = TRUE",
      [slug]
    );
    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    const playlist = playlistResult.rows[0];
    const videosResult = await pool.query(
      `SELECT * FROM video 
       WHERE playlist_id = $1 AND is_active = TRUE 
       ORDER BY display_order ASC, created_at DESC`,
      [playlist.playlist_id]
    );
    res.json({
      ...playlist,
      videos: videosResult.rows,
    });
  } catch (err) {
    console.error("Get playlist error:", err);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
};

// Search playlists (autocomplete for admin)
export const searchPlaylists = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json([]);
    }
    const result = await pool.query(
      `SELECT playlist_id, name, slug 
       FROM playlist 
       WHERE name ILIKE $1 
       ORDER BY name ASC 
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Search playlists error:", err);
    res.status(500).json({ error: "Failed to search playlists" });
  }
};

// Create playlist (admin)
export const createPlaylist = async (req, res) => {
  try {
    const { name, description, thumbnailUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Playlist name is required" });
    }
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const result = await pool.query(
      `INSERT INTO playlist (name, slug, description, thumbnail_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, description || null, thumbnailUrl || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Playlist already exists" });
    }
    console.error("Create playlist error:", err);
    res.status(500).json({ error: "Failed to create playlist" });
  }
};

// Update playlist (admin)
export const updatePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, thumbnailUrl, displayOrder, isActive } =
      req.body;
    const result = await pool.query(
      `UPDATE playlist 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           display_order = COALESCE($4, display_order),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE playlist_id = $6
       RETURNING *`,
      [name, description, thumbnailUrl, displayOrder, isActive, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update playlist error:", err);
    res.status(500).json({ error: "Failed to update playlist" });
  }
};

// Delete playlist (admin)
export const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM playlist WHERE playlist_id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    res.json({ success: true, message: "Playlist deleted" });
  } catch (err) {
    console.error("Delete playlist error:", err);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
};
