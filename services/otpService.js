import { pool } from "../util/db.js";
import axios from "axios";

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";
const ROUTE = "dlt";
const SENDER_ID = "SKLCSE";
const TEMPLATE_ID = "210004";

// Generate 6-digit OTP
export const generateOtp = () => {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

// Save OTP to database
export const saveOtp = async (phoneNumber, otpCode) => {
  // Delete existing OTPs for this phone
  await pool.query("DELETE FROM otp_verification WHERE phone_number = $1", [
    phoneNumber,
  ]);

  // Insert new OTP
  await pool.query(
    `INSERT INTO otp_verification (phone_number, otp_code, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
    [phoneNumber, otpCode]
  );
  return otpCode;
};

// Verify OTP
export const verifyOtp = async (phoneNumber, otpCode) => {
  const result = await pool.query(
    `SELECT * FROM otp_verification 
     WHERE phone_number = $1 
     AND otp_code = $2 
     AND expires_at > NOW() 
     AND verified = FALSE`,
    [phoneNumber, otpCode]
  );
  if (result.rows.length === 0) {
    return { valid: false };
  }

  // Mark as verified
  await pool.query(
    "UPDATE otp_verification SET verified = TRUE WHERE id = $1",
    [result.rows[0].id]
  );
  return { valid: true };
};

// Send OTP via Fast2SMS (DLT Route Template)
export const sendOtpSms = async (phone, otp) => {
  try {
    // Normalize phone - remove country code if present
    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
    
    console.log(`[OTP] Sending OTP ${otp} to ${normalizedPhone} via DLT template`);

    // If no API key, just log (for local dev without SMS)
    if (!process.env.FAST2SMS_API_KEY) {
      console.log(`[DEV] No FAST2SMS_API_KEY set. OTP: ${otp}`);
      return true;
    }

    const params = new URLSearchParams({
      authorization: process.env.FAST2SMS_API_KEY,
      route: ROUTE,
      sender_id: SENDER_ID,
      message: TEMPLATE_ID,
      variables_values: otp,
      flash: "0",
      numbers: normalizedPhone,
      schedule_time: "",
    });

    const response = await axios.get(`${FAST2SMS_URL}?${params.toString()}`, {
      headers: { "cache-control": "no-cache" },
      timeout: 30000,
    });

    if (!response.data || (!response.data.return && response.data.status_code !== 200)) {
      console.error("Fast2SMS error:", response.data);
      console.log(`[DEV FALLBACK] Fast2SMS failed. OTP: ${otp}`);
      return true; // Don't block dev
    }

    console.log(`[OTP] SMS sent successfully to ${normalizedPhone}`);
    return true;
  } catch (error) {
    console.error("Fast2SMS Error:", error.message);
    console.log(`[DEV FALLBACK] SMS failed. OTP: ${otp}`);
    return true; // Don't throw - allow dev mode fallback
  }
};
