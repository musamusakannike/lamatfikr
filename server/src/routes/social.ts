import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  sendFriendRequest,
  respondToFriendRequest,
  unfriend,
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  blockUser,
  unblockUser,
  getBlockedUsers,
  muteUser,
  unmuteUser,
  getMutedUsers,
} from "../controllers/social.controller";

export const socialRouter = Router();

// Friendship routes
socialRouter.post("/friends/request", requireAuth, sendFriendRequest);
socialRouter.post("/friends/respond", requireAuth, respondToFriendRequest);
socialRouter.delete("/friends/:friendId", requireAuth, unfriend);
socialRouter.get("/friends", requireAuth, getFriends);
socialRouter.get("/friends/requests/pending", requireAuth, getPendingFriendRequests);
socialRouter.get("/friends/requests/sent", requireAuth, getSentFriendRequests);

// Follow routes
socialRouter.post("/follow", requireAuth, followUser);
socialRouter.post("/unfollow", requireAuth, unfollowUser);
socialRouter.get("/followers", requireAuth, getFollowers);
socialRouter.get("/followers/:userId", getFollowers);
socialRouter.get("/following", requireAuth, getFollowing);
socialRouter.get("/following/:userId", getFollowing);
socialRouter.get("/follow-status/:targetUserId", requireAuth, checkFollowStatus);

// Block routes
socialRouter.post("/block", requireAuth, blockUser);
socialRouter.post("/unblock", requireAuth, unblockUser);
socialRouter.get("/blocked", requireAuth, getBlockedUsers);

// Mute routes
socialRouter.post("/mute", requireAuth, muteUser);
socialRouter.post("/unmute", requireAuth, unmuteUser);
socialRouter.get("/muted", requireAuth, getMutedUsers);
