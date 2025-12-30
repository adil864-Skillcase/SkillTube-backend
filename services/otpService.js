import { pool } from "../util/db.js";

// Generate 6-digit OTP
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to database
export const saveOtp = async (phoneNumber, otpCode) => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  // Delete existing OTPs for this phone
  await pool.query("DELETE FROM otp_verification WHERE phone_number = $1", [
    phoneNumber,
  ]);

  // Insert new OTP
  await pool.query(
    `INSERT INTO otp_verification (phone_number, otp_code, expires_at)
     VALUES ($1, $2, $3)`,
    [phoneNumber, otpCode, expiresAt]
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

// Send OTP via SMS (placeholder - integrate your SMS provider)
export const sendOtpSms = async (phoneNumber, otpCode) => {
  // For development, just log the OTP
  console.log(`[DEV] OTP for ${phoneNumber}: ${otpCode}`);

  // Example Twilio integration:
  // const twilio = require('twilio')(accountSid, authToken);
  // await twilio.messages.create({
  //   body: `Your Skilltube OTP is: ${otpCode}`,
  //   from: '+1234567890',
  //   to: phoneNumber
  // });

  return true;
};
