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

// Middlewares
import { authMiddleware, authorizeRole } from "./middlewares/authMiddleware.js";

// Jobs
import { initOtpCleanupJob } from "./jobs/otpCleanupJob.js";

const app = express();

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5173",
  "capacitor://localhost",
  "https://localhost",
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
  res.send("Skilltube Backend running!");
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

// Admin Routes
app.use("/api/upload", authMiddleware, authorizeRole("admin"), uploadRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
