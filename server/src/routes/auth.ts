import { Router } from "express";

import {
  register,
  login,
  refreshAccessToken,
  socialAuth,
  completeSocialProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  getStreamToken,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/social", socialAuth);
authRouter.post("/social/complete-profile", completeSocialProfile);
authRouter.get("/verify-email", verifyEmail);
authRouter.post("/resend-verification", resendVerification);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", requireAuth, getMe);
authRouter.get("/stream-token", requireAuth, getStreamToken);
