import admin from "firebase-admin";

let initialized = false;

/**
 * Lazy-initialises Firebase Admin SDK using the base64-encoded
 * service account JSON stored in FIREBASE_SERVICE_ACCOUNT_BASE64.
 *
 * Why base64? The service account JSON contains a private_key with
 * real newline characters that break .env file parsing.
 * Solution: base64-encode the entire JSON file and decode at runtime.
 *
 * To encode (PowerShell):
 *   [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccountKey.json"))
 */
function getFirebaseAdmin() {
  if (initialized) return admin;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 is not set in environment variables"
    );
  }

  const serviceAccount = JSON.parse(
    Buffer.from(base64, "base64").toString("utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  console.log("[Firebase] Admin SDK initialised");
  return admin;
}

/**
 * Sends a push notification to a single FCM token.
 *
 * @param {object} params
 * @param {string} params.fcmToken  - FCM device token from the app
 * @param {string} params.title     - Notification title
 * @param {string} params.body      - Notification body text
 * @param {object} [params.data]    - Optional key-value payload (all values become strings)
 * @returns {Promise<string|{invalidToken: true}>}
 */
export async function sendPushNotification({ fcmToken, title, body, data = {} }) {
  const firebaseAdmin = getFirebaseAdmin();

  const message = {
    token: fcmToken,
    notification: { title, body },
    // FCM data payload — all values must be strings
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "default",
      },
    },
  };

  try {
    const messageId = await firebaseAdmin.messaging().send(message);
    return messageId;
  } catch (err) {
    // Token is no longer valid — caller should clear it from DB
    if (err.code === "messaging/registration-token-not-registered") {
      return { invalidToken: true };
    }
    throw err;
  }
}
