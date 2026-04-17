import { pool } from "../util/db.js";
import { PERMISSION_KEYS } from "../constants/permissions.js";

const getPermissionSet = async (userId) => {
  const result = await pool.query(
    `SELECT permission_key FROM admin_permission WHERE admin_user_id = $1`,
    [userId]
  );
  return new Set(result.rows.map((row) => row.permission_key));
};

export const attachPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      req.userPermissions = [];
      return next();
    }

    if (req.user.role === "super_admin") {
      req.userPermissions = [...PERMISSION_KEYS];
      return next();
    }

    if (req.user.role !== "admin") {
      req.userPermissions = [];
      return next();
    }

    const permissions = await getPermissionSet(req.user.user_id);
    req.userPermissions = [...permissions];
    next();
  } catch (err) {
    console.error("Permission attach error:", err);
    res.status(500).json({ error: "Failed to evaluate permissions" });
  }
};

export const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.role === "super_admin") {
        return next();
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const permissions = req.userPermissions?.length
        ? new Set(req.userPermissions)
        : await getPermissionSet(req.user.user_id);

      if (!permissions.has(permissionKey)) {
        return res.status(403).json({ error: "Permission denied" });
      }

      req.userPermissions = [...permissions];
      next();
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ error: "Failed to validate permissions" });
    }
  };
};
