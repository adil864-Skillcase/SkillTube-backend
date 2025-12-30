import { Router } from "express";
import {
  sendOtp,
  verifyOtpAndLogin,
  getMe,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndLogin);
router.get("/me", authMiddleware, getMe);

export default router;
