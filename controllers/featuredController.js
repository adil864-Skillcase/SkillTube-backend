import { pool } from "../util/db.js";

const resolveFeaturedVideos = async (section) => {
  const limit = section.max_items || 5;

  if (section.mode === "manual") {
    const result = await pool.query(
      `SELECT v.*, p.slug as playlist_slug, p.name as playlist_name
       FROM featured_video fv
       JOIN video v ON fv.video_id = v.video_id
       JOIN playlist p ON v.playlist_id = p.playlist_id
       WHERE fv.section_id = $1 AND fv.is_active = TRUE AND v.is_active = TRUE
       ORDER BY fv.manual_order ASC, fv.created_at DESC
       LIMIT $2`,
      [section.section_id, limit]
    );
    return result.rows;
  }

  if (section.mode === "most_viewed") {
    const result = await pool.query(
      `SELECT v.*, p.slug as playlist_slug, p.name as playlist_name
       FROM video v
       JOIN playlist p ON v.playlist_id = p.playlist_id
       WHERE v.is_active = TRUE
       ORDER BY v.view_count DESC, v.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  if (section.mode === "most_liked") {
    const result = await pool.query(
      `SELECT v.*, p.slug as playlist_slug, p.name as playlist_name
       FROM video v
       JOIN playlist p ON v.playlist_id = p.playlist_id
       WHERE v.is_active = TRUE
       ORDER BY v.like_count DESC, v.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  if (section.mode === "most_commented") {
    const result = await pool.query(
      `SELECT v.*, p.slug as playlist_slug, p.name as playlist_name,
              COUNT(c.comment_id) AS comment_count
       FROM video v
       JOIN playlist p ON v.playlist_id = p.playlist_id
       LEFT JOIN comment c ON c.video_id = v.video_id
       WHERE v.is_active = TRUE
       GROUP BY v.video_id, p.slug, p.name
       ORDER BY COUNT(c.comment_id) DESC, v.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  if (section.mode === "newest") {
    const result = await pool.query(
      `SELECT v.*, p.slug as playlist_slug, p.name as playlist_name
       FROM video v
       JOIN playlist p ON v.playlist_id = p.playlist_id
       WHERE v.is_active = TRUE
       ORDER BY v.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  const trendingResult = await pool.query(
    `SELECT
      v.*,
      p.slug as playlist_slug,
      p.name as playlist_name,
      (
        COALESCE(v.view_count, 0) * 1 +
        COALESCE(v.like_count, 0) * 3 +
        COALESCE(COUNT(c.comment_id), 0) * 4
      ) AS trending_score
     FROM video v
     JOIN playlist p ON v.playlist_id = p.playlist_id
     LEFT JOIN comment c
       ON c.video_id = v.video_id
      AND c.created_at >= NOW() - INTERVAL '24 hours'
     WHERE v.is_active = TRUE
       AND v.created_at >= NOW() - INTERVAL '24 hours'
     GROUP BY v.video_id, p.slug, p.name
     ORDER BY trending_score DESC, v.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return trendingResult.rows;
};

export const getHomeFeatured = async (req, res) => {
  try {
    const sectionResult = await pool.query(
      `SELECT * FROM featured_section WHERE is_active = TRUE
       ORDER BY updated_at DESC LIMIT 1`
    );

    if (!sectionResult.rows.length) {
      return res.json({
        mode: "most_viewed",
        title: "Featured",
        items: [],
      });
    }

    const section = sectionResult.rows[0];
    const items = await resolveFeaturedVideos(section);
    res.json({
      sectionId: section.section_id,
      mode: section.mode,
      title: section.title,
      maxItems: section.max_items,
      config: section.config_json || {},
      items,
    });
  } catch (err) {
    console.error("Get featured section error:", err);
    res.status(500).json({ error: "Failed to fetch featured section" });
  }
};

export const updateFeaturedSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { mode, title, maxItems, isActive, config, manualVideoIds } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sectionResult = await client.query(
        `UPDATE featured_section
         SET mode = COALESCE($1, mode),
             title = COALESCE($2, title),
             max_items = COALESCE($3, max_items),
             is_active = COALESCE($4, is_active),
             config_json = COALESCE($5, config_json),
             updated_at = CURRENT_TIMESTAMP
         WHERE section_id = $6
         RETURNING *`,
        [mode, title, maxItems, isActive, config || null, sectionId]
      );

      if (!sectionResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Featured section not found" });
      }

      if (Array.isArray(manualVideoIds)) {
        await client.query(`DELETE FROM featured_video WHERE section_id = $1`, [sectionId]);
        for (let idx = 0; idx < manualVideoIds.length; idx += 1) {
          await client.query(
            `INSERT INTO featured_video (section_id, video_id, manual_order, is_active)
             VALUES ($1, $2, $3, TRUE)`,
            [sectionId, manualVideoIds[idx], idx]
          );
        }
      }

      await client.query("COMMIT");
      res.json(sectionResult.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Update featured section error:", err);
    res.status(500).json({ error: "Failed to update featured section" });
  }
};
