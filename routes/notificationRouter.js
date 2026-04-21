import { Router } from "express";
import { registerToken, sendToUser, broadcast } from "../controllers/notificationController.js";
import { authMiddleware, authorizeRole } from "../middlewares/authMiddleware.js";

const router = Router();

// App endpoints (any authenticated user)
router.post("/register-token", authMiddleware, registerToken);

// Admin-only endpoints
router.post("/send", authMiddleware, authorizeRole("admin", "super_admin"), sendToUser);
router.post("/broadcast", authMiddleware, authorizeRole("admin", "super_admin"), broadcast);

export default router;
