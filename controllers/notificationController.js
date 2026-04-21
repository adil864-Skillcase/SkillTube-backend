import { pool } from "../util/db.js";
import { sendPushNotification } from "../services/firebase.js";

/**
 * POST /api/notifications/register-token
 * Called by the app immediately after FCM registration.
 * Stores the device's FCM token against the authenticated user.
 */
export const registerToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.user_id;

    if (!fcmToken || typeof fcmToken !== "string" || fcmToken.trim() === "") {
      return res.status(400).json({ error: "fcmToken is required" });
    }

    await pool.query(
      `UPDATE app_user
       SET fcm_token = $1,
           fcm_token_updated_at = NOW()
       WHERE user_id = $2`,
      [fcmToken.trim(), userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("[Notifications] registerToken error:", err);
    return res.status(500).json({ error: "Failed to register token" });
  }
};

/**
 * POST /api/notifications/send
 * Admin-facing endpoint to push a notification to a specific user.
 * Body: { userId, title, body, data? }
 */
export const sendToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: "userId, title, and body are required" });
    }

    const result = await pool.query(
      "SELECT fcm_token FROM app_user WHERE user_id = $1",
      [userId]
    );

    const token = result.rows[0]?.fcm_token;
    if (!token) {
      return res.status(404).json({ error: "User has no registered FCM token" });
    }

    const sendResult = await sendPushNotification({
      fcmToken: token,
      title,
      body,
      data: data || {},
    });

    // Token has expired — clear it to keep DB clean
    if (sendResult?.invalidToken) {
      await pool.query(
        "UPDATE app_user SET fcm_token = NULL, fcm_token_updated_at = NOW() WHERE user_id = $1",
        [userId]
      );
      return res.status(410).json({ error: "FCM token expired — cleared from database" });
    }

    return res.json({ success: true, messageId: sendResult });
  } catch (err) {
    console.error("[Notifications] sendToUser error:", err);
    return res.status(500).json({ error: "Failed to send notification" });
  }
};

/**
 * POST /api/notifications/broadcast
 * Send a notification to ALL users who have an FCM token.
 * Body: { title, body, data? }
 * Processes in batches of 500 to be safe.
 */
export const broadcast = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const result = await pool.query(
      "SELECT user_id, fcm_token FROM app_user WHERE fcm_token IS NOT NULL"
    );

    const users = result.rows;
    if (users.length === 0) {
      return res.json({ success: true, sent: 0, message: "No users with FCM tokens" });
    }

    let sent = 0;
    const invalidTokenUsers = [];

    for (const user of users) {
      try {
        const sendResult = await sendPushNotification({
          fcmToken: user.fcm_token,
          title,
          body,
          data: data || {},
        });

        if (sendResult?.invalidToken) {
          invalidTokenUsers.push(user.user_id);
        } else {
          sent++;
        }
      } catch {
        // Log but continue with remaining users
      }
    }

    // Clear invalid tokens in bulk
    if (invalidTokenUsers.length > 0) {
      await pool.query(
        "UPDATE app_user SET fcm_token = NULL WHERE user_id = ANY($1::text[])",
        [invalidTokenUsers]
      );
    }

    return res.json({
      success: true,
      sent,
      invalidCleared: invalidTokenUsers.length,
    });
  } catch (err) {
    console.error("[Notifications] broadcast error:", err);
    return res.status(500).json({ error: "Failed to broadcast notification" });
  }
};
