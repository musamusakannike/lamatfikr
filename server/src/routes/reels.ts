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
  shareReel,
  createReelComment,
  getReelComments,
  getReelCommentReplies,
  updateReelComment,
  deleteReelComment,
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
reelsRouter.post("/:reelId/share", requireAuth, shareReel);

// Comments
reelsRouter.post("/:reelId/comments", requireAuth, createReelComment);
reelsRouter.get("/:reelId/comments", getReelComments);
reelsRouter.get("/:reelId/comments/:commentId/replies", getReelCommentReplies);
reelsRouter.patch("/:reelId/comments/:commentId", requireAuth, updateReelComment);
reelsRouter.delete("/:reelId/comments/:commentId", requireAuth, deleteReelComment);
