import { pool } from "../util/db.js";

// Get user's reaction on a video
export const getReaction = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.user_id;
    if (!userId) {
      return res.json({ reaction: null });
    }
    const result = await pool.query(
      "SELECT reaction FROM user_video_reaction WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );
    res.json({ reaction: result.rows[0]?.reaction || null });
  } catch (err) {
    console.error("Get reaction error:", err);
    res.status(500).json({ error: "Failed to get reaction" });
  }
};

// Like a video
export const likeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.user_id;
    // Check existing reaction
    const existing = await pool.query(
      "SELECT reaction FROM user_video_reaction WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );
    const prevReaction = existing.rows[0]?.reaction;
    if (prevReaction === "like") {
      // Remove like
      await pool.query(
        "DELETE FROM user_video_reaction WHERE user_id = $1 AND video_id = $2",
        [userId, videoId]
      );
      await pool.query(
        "UPDATE video SET like_count = like_count - 1 WHERE video_id = $1",
        [videoId]
      );
      return res.json({ success: true, reaction: null });
    }

    if (prevReaction === "dislike") {
      // Switch from dislike to like
      await pool.query(
        "UPDATE user_video_reaction SET reaction = 'like' WHERE user_id = $1 AND video_id = $2",
        [userId, videoId]
      );
      await pool.query(
        "UPDATE video SET like_count = like_count + 1, dislike_count = dislike_count - 1 WHERE video_id = $1",
        [videoId]
      );
    } else {
      // New like
      await pool.query(
        "INSERT INTO user_video_reaction (user_id, video_id, reaction) VALUES ($1, $2, 'like')",
        [userId, videoId]
      );
      await pool.query(
        "UPDATE video SET like_count = like_count + 1 WHERE video_id = $1",
        [videoId]
      );
    }
    res.json({ success: true, reaction: "like" });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to like video" });
  }
};

// Dislike a video
export const dislikeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.user_id;
    const existing = await pool.query(
      "SELECT reaction FROM user_video_reaction WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );
    const prevReaction = existing.rows[0]?.reaction;
    if (prevReaction === "dislike") {
      // Remove dislike
      await pool.query(
        "DELETE FROM user_video_reaction WHERE user_id = $1 AND video_id = $2",
        [userId, videoId]
      );
      await pool.query(
        "UPDATE video SET dislike_count = dislike_count - 1 WHERE video_id = $1",
        [videoId]
      );
      return res.json({ success: true, reaction: null });
    }
    if (prevReaction === "like") {
      // Switch from like to dislike
      await pool.query(
        "UPDATE user_video_reaction SET reaction = 'dislike' WHERE user_id = $1 AND video_id = $2",
        [userId, videoId]
      );
      await pool.query(
        "UPDATE video SET dislike_count = dislike_count + 1, like_count = like_count - 1 WHERE video_id = $1",
        [videoId]
      );
    } else {
      // New dislike
      await pool.query(
        "INSERT INTO user_video_reaction (user_id, video_id, reaction) VALUES ($1, $2, 'dislike')",
        [userId, videoId]
      );
      await pool.query(
        "UPDATE video SET dislike_count = dislike_count + 1 WHERE video_id = $1",
        [videoId]
      );
    }
    res.json({ success: true, reaction: "dislike" });
  } catch (err) {
    console.error("Dislike error:", err);
    res.status(500).json({ error: "Failed to dislike video" });
  }
};

// Get video stats (likes, dislikes, views)
export const getVideoStats = async (req, res) => {
  try {
    const { videoId } = req.params;
    const result = await pool.query(
      "SELECT like_count, dislike_count, view_count FROM video WHERE video_id = $1",
      [videoId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Failed to get stats" });
  }
};

// Get user's liked videos
export const getLikedVideos = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(
      `SELECT v.*, p.slug as playlist_slug, p.name as playlist_name
       FROM video v
       JOIN user_video_reaction r ON v.video_id = r.video_id
       JOIN playlist p ON v.playlist_id = p.playlist_id
       WHERE r.user_id = $1 AND r.reaction = 'like'
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get liked videos error:", err);
    res.status(500).json({ error: "Failed to fetch liked videos" });
  }
};
