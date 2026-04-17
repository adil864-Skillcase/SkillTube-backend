import { pool } from "../util/db.js";
import { PERMISSION_KEYS } from "../constants/permissions.js";

export const getAdminPermissions = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    if (!adminUserId) {
      return res.status(400).json({ error: "adminUserId is required" });
    }

    const userResult = await pool.query(
      `SELECT user_id, name, role FROM app_user WHERE user_id = $1`,
      [adminUserId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const permissionResult = await pool.query(
      `SELECT permission_key FROM admin_permission
       WHERE admin_user_id = $1
       ORDER BY permission_key ASC`,
      [adminUserId]
    );

    res.json({
      user: userResult.rows[0],
      permissions: permissionResult.rows.map((row) => row.permission_key),
      availablePermissions: PERMISSION_KEYS,
    });
  } catch (err) {
    console.error("Get admin permissions error:", err);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

export const grantAdminPermission = async (req, res) => {
  try {
    const { adminUserId, permissionKey } = req.body;
    if (!adminUserId || !permissionKey) {
      return res
        .status(400)
        .json({ error: "adminUserId and permissionKey are required" });
    }
    if (!PERMISSION_KEYS.includes(permissionKey)) {
      return res.status(400).json({ error: "Invalid permission key" });
    }

    const userResult = await pool.query(
      `SELECT user_id, role FROM app_user WHERE user_id = $1`,
      [adminUserId]
    );
    if (!userResult.rows.length || userResult.rows[0].role !== "admin") {
      return res.status(400).json({ error: "Target user is not an admin" });
    }

    await pool.query(
      `INSERT INTO admin_permission (admin_user_id, permission_key, granted_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (admin_user_id, permission_key) DO NOTHING`,
      [adminUserId, permissionKey, req.user.user_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Grant admin permission error:", err);
    res.status(500).json({ error: "Failed to grant permission" });
  }
};

export const revokeAdminPermission = async (req, res) => {
  try {
    const { adminUserId, permissionKey } = req.body;
    if (!adminUserId || !permissionKey) {
      return res
        .status(400)
        .json({ error: "adminUserId and permissionKey are required" });
    }

    await pool.query(
      `DELETE FROM admin_permission
       WHERE admin_user_id = $1 AND permission_key = $2`,
      [adminUserId, permissionKey]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Revoke admin permission error:", err);
    res.status(500).json({ error: "Failed to revoke permission" });
  }
};
