import cron from "node-cron";
import { pool } from "../util/db.js";

export const initOtpCleanupJob = () => {
  // Run every Sunday at 3:00 AM
  cron.schedule("0 3 * * 0", async () => {
    try {
      const result = await pool.query(`
        DELETE FROM otp_verification 
        WHERE expires_at < NOW() OR verified = TRUE
      `);
      console.log(
        `[OTP Cleanup] Deleted ${result.rowCount} expired/verified OTPs`
      );
    } catch (err) {
      console.error("[OTP Cleanup] Error:", err.message);
    }
  });
  console.log("OTP cleanup job scheduled");
};
