import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Database
import { pool, initDb } from "./util/db.js";

// Routes
import authRouter from "./routes/authRouter.js";
import playlistRouter from "./routes/playlistRouter.js";
import videoRouter from "./routes/videoRouter.js";
import uploadRouter from "./routes/uploadRouter.js";
import reactionRouter from "./routes/reactionRouter.js";
import commentRouter from "./routes/commentRouter.js";
import bookmarkRouter from "./routes/bookmarkRouter.js";
import categoryRouter from "./routes/categoryRouter.js";
import featuredRouter from "./routes/featuredRouter.js";
import adminPermissionRouter from "./routes/adminPermissionRouter.js";
import dashboardRouter from "./routes/dashboardRouter.js";
import notificationRouter from "./routes/notificationRouter.js";

// Middlewares
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { attachPermissions } from "./middlewares/permissionMiddleware.js";

// Jobs
import { initOtpCleanupJob } from "./jobs/otpCleanupJob.js";

const app = express();

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5173",
  "capacitor://localhost",
  "https://localhost",
  "https://skilltube-frontend.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Database
initDb(pool);

// Initialize Cron Jobs
initOtpCleanupJob();

// Health Check
app.get("/", (req, res) => {
  res.send("SkillSnap Backend running!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

//Routes
app.use("/api/auth", authRouter);
app.use("/api/playlists", playlistRouter);
app.use("/api/videos", videoRouter);
app.use("/api/reactions", reactionRouter);
app.use("/api/comments", commentRouter);
app.use("/api/bookmarks", bookmarkRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/featured", featuredRouter);
app.use("/api/admin/permissions", adminPermissionRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationRouter);

// Admin Routes
app.use(
  "/api/upload",
  authMiddleware,
  attachPermissions,
  uploadRouter
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
