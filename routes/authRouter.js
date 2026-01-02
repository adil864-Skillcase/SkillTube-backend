import { Router } from "express";
import {
  sendOtp,
  verifyOtpAndLogin,
  getMe,
  loginWithPhone,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// OTP routes (uncomment for production)
// router.post("/send-otp", sendOtp);
// router.post("/verify-otp", verifyOtpAndLogin);

// Simple login (no OTP - for testing)
router.post("/login", loginWithPhone);

// Protected route
router.get("/me", authMiddleware, getMe);

export default router;

