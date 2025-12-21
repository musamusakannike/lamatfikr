import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createReel,
  getReelsFeed,
  getReel,
  updateReel,
  deleteReel,
  likeReel,
  recordReelView,
  getUserReels,
} from "../controllers/reel.controller";

export const reelsRouter = Router();

reelsRouter.post("/", requireAuth, createReel);
reelsRouter.get("/feed", requireAuth, getReelsFeed);
reelsRouter.get("/user/:userId", getUserReels);
reelsRouter.get("/:reelId", getReel);
reelsRouter.put("/:reelId", requireAuth, updateReel);
reelsRouter.delete("/:reelId", requireAuth, deleteReel);
reelsRouter.post("/:reelId/like", requireAuth, likeReel);
reelsRouter.post("/:reelId/view", recordReelView);
