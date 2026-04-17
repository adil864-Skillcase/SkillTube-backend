import { pool } from "../util/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Only allow admins
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const [usersRes, categoriesRes, playlistsRes, videosRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM app_user`),
      pool.query(`SELECT COUNT(*) FROM category WHERE is_active = TRUE`),
      pool.query(`SELECT COUNT(*) FROM playlist`),
      pool.query(`SELECT COUNT(*) FROM video`)
    ]);

    res.json({
      totalUsers: parseInt(usersRes.rows[0].count, 10) || 0,
      totalCategories: parseInt(categoriesRes.rows[0].count, 10) || 0,
      totalPlaylists: parseInt(playlistsRes.rows[0].count, 10) || 0,
      totalVideos: parseInt(videosRes.rows[0].count, 10) || 0,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
