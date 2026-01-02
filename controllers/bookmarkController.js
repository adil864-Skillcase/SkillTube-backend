import { pool } from "../util/db.js";

export const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT v.*, p.name as playlist_name, p.slug as playlist_slug
       FROM bookmark b
       JOIN video v ON b.video_id = v.video_id
       JOIN playlist p ON v.playlist_id = p.playlist_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get bookmarks error:", err);
    res.status(500).json({ error: "Failed to get bookmarks" });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.user_id;

    const existing = await pool.query(
      "SELECT * FROM bookmark WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM bookmark WHERE user_id = $1 AND video_id = $2",
        [userId, videoId]
      );
      return res.json({ bookmarked: false });
    }

    await pool.query(
      "INSERT INTO bookmark (user_id, video_id) VALUES ($1, $2)",
      [userId, videoId]
    );

    res.json({ bookmarked: true });
  } catch (err) {
    console.error("Toggle bookmark error:", err);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
};

export const checkBookmark = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) return res.json({ bookmarked: false });

    const result = await pool.query(
      "SELECT * FROM bookmark WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );

    res.json({ bookmarked: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to check bookmark" });
  }
};
