import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  createCommunity,
  getCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  sendMessage,
  getMessages,
  markCommunityAsRead,
  getTotalUnreadCount,
  toggleReaction,
  deleteMessage,
  editMessage,
  markAsViewed,
} from "../controllers/community.controller";

export const communitiesRouter = Router();

// All routes require authentication
communitiesRouter.use(requireAuth);

// Community CRUD
communitiesRouter.post("/", createCommunity);
communitiesRouter.get("/", getCommunities);
communitiesRouter.get("/unread-count", getTotalUnreadCount);
communitiesRouter.get("/:communityId", getCommunity);
communitiesRouter.patch("/:communityId", updateCommunity);
communitiesRouter.delete("/:communityId", deleteCommunity);

// Membership
communitiesRouter.post("/:communityId/join", joinCommunity);
communitiesRouter.post("/:communityId/leave", leaveCommunity);

// Members management
communitiesRouter.get("/:communityId/members", getCommunityMembers);

// Messages
communitiesRouter.post("/:communityId/messages", sendMessage);
communitiesRouter.get("/:communityId/messages", getMessages);
communitiesRouter.post("/:communityId/read", markCommunityAsRead);
communitiesRouter.post("/:communityId/messages/:messageId/reactions", toggleReaction);
communitiesRouter.delete("/:communityId/messages/:messageId", deleteMessage);
communitiesRouter.patch("/:communityId/messages/:messageId", editMessage);
communitiesRouter.post("/:communityId/messages/:messageId/view", markAsViewed);
