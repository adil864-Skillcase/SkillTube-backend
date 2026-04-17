import { pool } from "../util/db.js";

const toSlug = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getCategories = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const result = await pool.query(
      `SELECT c.*, COUNT(p.playlist_id)::int as playlist_count 
       FROM category c
       LEFT JOIN playlist p ON (c.category_id = p.category_id OR LOWER(c.slug) = LOWER(p.category) OR LOWER(c.name) = LOWER(p.category) OR CAST(c.category_id AS TEXT) = p.category)
       WHERE ($1::boolean = TRUE OR c.is_active = TRUE)
       GROUP BY c.category_id
       ORDER BY c.display_order ASC, c.created_at ASC`,
      [includeInactive]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, iconKey, color } = req.body;
    if (!name || !iconKey) {
      return res.status(400).json({ error: "name and iconKey are required" });
    }

    const slug = toSlug(name);
    const result = await pool.query(
      `INSERT INTO category (name, slug, icon_key, color, display_order)
       VALUES ($1, $2, $3, $4,
         COALESCE((SELECT MAX(display_order) + 1 FROM category), 0)
       )
       RETURNING *`,
      [name.trim(), slug, iconKey.trim(), color || "#3b82f6"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Category already exists" });
    }
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iconKey, color, isActive } = req.body;

    const slug = name ? toSlug(name) : null;
    const result = await pool.query(
      `UPDATE category
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           icon_key = COALESCE($3, icon_key),
           color = COALESCE($4, color),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE category_id = $6
       RETURNING *`,
      [name?.trim(), slug, iconKey?.trim(), color, isActive, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query("BEGIN");

    // 1. Get all playlists attached to this category
    const playlistsRes = await client.query(
      `SELECT playlist_id FROM playlist WHERE category_id = $1`,
      [id]
    );

    const playlistIds = playlistsRes.rows.map(row => row.playlist_id);

    // 2. Delete ALL videos belonging to those playlists (or possessing this category directly)
    if (playlistIds.length > 0) {
      await client.query(
        `DELETE FROM video WHERE playlist_id = ANY($1::int[]) OR category_id = $2`,
        [playlistIds, id]
      );
      // 3. Delete those playlists attached to the category
      await client.query(
        `DELETE FROM playlist WHERE category_id = $1`,
        [id]
      );
    } else {
      // Just in case any videos were somehow directly attached without a playlist
      await client.query(
        `DELETE FROM video WHERE category_id = $1`,
        [id]
      );
    }

    // 4. Finally delete the category itself
    const result = await client.query(
      `DELETE FROM category WHERE category_id = $1 RETURNING category_id`,
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Category not found" });
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Category and associative content deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  } finally {
    client.release();
  }
};

export const reorderCategories = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items must be an array" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      await client.query(
        `UPDATE category SET display_order = $1, updated_at = CURRENT_TIMESTAMP
         WHERE category_id = $2`,
        [item.displayOrder, item.categoryId]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Reorder category error:", err);
    res.status(500).json({ error: "Failed to reorder categories" });
  } finally {
    client.release();
  }
};
