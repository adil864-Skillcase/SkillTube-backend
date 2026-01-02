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

// Send OTP via Fast2SMS (Quick SMS route - no verification needed)
export const sendOtpSms = async (phoneNumber, otpCode) => {
  // Remove country code if present (Fast2SMS needs 10-digit number)
  const cleanNumber = phoneNumber.replace(/^\+91/, "").replace(/^91/, "");

  // Log for development
  console.log(`[OTP] Sending OTP ${otpCode} to ${cleanNumber}`);

  // If no API key, just log (for local dev without SMS)
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`[DEV] No FAST2SMS_API_KEY set. OTP: ${otpCode}`);
    return true;
  }

  try {
    // Using Quick SMS route (no DLT/verification required)
    const message = `Your SkillTube OTP is: ${otpCode}. Valid for 5 minutes.`;
    const response = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=q&message=${encodeURIComponent(message)}&flash=0&numbers=${cleanNumber}`
    );
    const data = await response.json();

    if (!data.return) {
      console.error("Fast2SMS error:", data);
      // Don't throw - allow dev mode fallback
      console.log(`[DEV FALLBACK] Fast2SMS failed. OTP: ${otpCode}`);
      return true;
    }

    console.log(`[OTP] SMS sent successfully to ${cleanNumber}`);
    return true;
  } catch (err) {
    console.error("Fast2SMS error:", err);
    // Don't throw - allow dev mode fallback
    console.log(`[DEV FALLBACK] SMS failed. OTP: ${otpCode}`);
    return true;
  }
};
