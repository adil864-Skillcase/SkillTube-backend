import { pool } from "../util/db.js";

export const getComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.name, u.phone_number 
       FROM comment c 
       JOIN app_user u ON c.user_id = u.user_id 
       WHERE c.video_id = $1 
       ORDER BY c.created_at DESC 
       LIMIT 50`,
      [videoId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: "Failed to get comments" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;

    const userId = req.user.user_id;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    const result = await pool.query(
      `INSERT INTO comment (video_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [videoId, userId, content.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.user_id;

    const result = await pool.query(
      "DELETE FROM comment WHERE comment_id = $1 AND user_id = $2 RETURNING *",
      [commentId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

export const getCommentCount = async (req, res) => {
  try {
    const { videoId } = req.params;

    const result = await pool.query(
      "SELECT COUNT(*) as count FROM comment WHERE video_id = $1",
      [videoId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: "Failed to get count" });
  }
};
