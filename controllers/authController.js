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
    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        name: user.name,
        role: user.role,
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
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
};
