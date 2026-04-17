import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../util/db.js";
import { jwtConfig } from "../config/configuration.js";
import {
  generateOtp,
  saveOtp,
  verifyOtp,
  sendOtpSms,
} from "../services/otpService.js";
import { PERMISSION_KEYS } from "../constants/permissions.js";

const getPermissionsForUser = async (user) => {
  if (!user) return [];
  if (user.role === "super_admin") {
    return [...PERMISSION_KEYS];
  }
  if (user.role !== "admin") {
    return [];
  }
  const permissionsResult = await pool.query(
    `SELECT permission_key FROM admin_permission WHERE admin_user_id = $1`,
    [user.user_id]
  );
  return permissionsResult.rows.map((row) => row.permission_key);
};

// Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    const otpCode = generateOtp();
    await saveOtp(phoneNumber, otpCode);
    await sendOtpSms(phoneNumber, otpCode);
    res.json({
      success: true,
      message: "OTP sent successfully",
      // Remove in production
      devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Verify OTP & Login/Register
export const verifyOtpAndLogin = async (req, res) => {
  try {
    const { phoneNumber, otpCode, name } = req.body;
    if (!phoneNumber || !otpCode) {
      return res
        .status(400)
        .json({ error: "Phone number and OTP are required" });
    }
    const otpResult = await verifyOtp(phoneNumber, otpCode);
    if (!otpResult.valid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    // Check if user exists
    let userResult = await pool.query(
      "SELECT * FROM app_user WHERE phone_number = $1",
      [phoneNumber]
    );
    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const userId = uuidv4();
      const newUser = await pool.query(
        `INSERT INTO app_user (user_id, phone_number, name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING user_id, phone_number, name, role`,
        [userId, phoneNumber, name || "User"]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    const permissions = await getPermissionsForUser(user);
    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        name: user.name,
        role: user.role,
        permissions,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    res.json({
      userId: req.user.user_id,
      phoneNumber: req.user.phone_number,
      name: req.user.name,
      role: req.user.role,
      permissions: await getPermissionsForUser(req.user),
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
};

// No OTP (keep for testing/fallback)
export const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    // Check if user exists
    let userResult = await pool.query(
      "SELECT * FROM app_user WHERE phone_number = $1",
      [phoneNumber]
    );
    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const userId = uuidv4();
      const newUser = await pool.query(
        `INSERT INTO app_user (user_id, phone_number, name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING user_id, phone_number, name, role`,
        [userId, phoneNumber, name || "User"]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];

      // Update name if provided
      if (name && name !== user.name) {
        const updated = await pool.query(
          "UPDATE app_user SET name = $1 WHERE user_id = $2 RETURNING *",
          [name, user.user_id]
        );
        user = updated.rows[0];
      }
    }
    // Generate JWT
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    const permissions = await getPermissionsForUser(user);
    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        name: user.name,
        role: user.role,
        permissions,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// Search Users (Admin only)
export const searchUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const query = req.query.q || "";
    const result = await pool.query(
      `SELECT user_id, phone_number, name, role, created_at 
       FROM app_user 
       WHERE name ILIKE $1 OR phone_number ILIKE $1 
       ORDER BY created_at DESC 
       LIMIT 15`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// Make User Admin (Admin only)
export const makeUserAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }
    
    // Specifically updating role to admin
    const result = await pool.query(
      `UPDATE app_user SET role = 'admin' WHERE user_id = $1 RETURNING user_id, name, phone_number, role`,
      [targetUserId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Make user admin error:", err);
    res.status(500).json({ error: "Failed to update user role" });
  }
};
