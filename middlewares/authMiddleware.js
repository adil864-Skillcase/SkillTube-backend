import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/configuration.js";
import { pool } from "../util/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(token, jwtConfig.secret);

    const result = await pool.query(
      "SELECT user_id, phone_number, name, role FROM app_user WHERE user_id = $1",
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, jwtConfig.secret);
      const result = await pool.query(
        "SELECT user_id, phone_number, name, role FROM app_user WHERE user_id = $1",
        [decoded.userId]
      );
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }
    next();
  } catch (err) {
    // Token invalid, continue without auth
    next();
  }
};
