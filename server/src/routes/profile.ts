import { Router } from "express";

import {
  getProfile,
  getPublicProfile,
  updateProfile,
  updateAvatar,
  updateCoverPhoto,
  getPrivacySettings,
  updatePrivacySettings,
  changePassword,
  deleteAccount,
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, getProfile);
profileRouter.get("/user/:username", getPublicProfile);
profileRouter.patch("/", requireAuth, updateProfile);
profileRouter.patch("/avatar", requireAuth, updateAvatar);
profileRouter.patch("/cover-photo", requireAuth, updateCoverPhoto);
profileRouter.get("/privacy", requireAuth, getPrivacySettings);
profileRouter.patch("/privacy", requireAuth, updatePrivacySettings);
profileRouter.post("/change-password", requireAuth, changePassword);
profileRouter.delete("/", requireAuth, deleteAccount);
