import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  getOrCreateConversation,
  getConversations,
  getConversation,
  sendMessage,
  getMessages,
  deleteMessage,
  markConversationAsRead,
  getUnreadCount,
  toggleReaction,
  updateConversationSettings,
  editMessage,
  markAsViewed,
  startConversationEvent,
  getConversationEvents,
  endConversationEvent,
} from "../controllers/message.controller";

export const messagesRouter = Router();

// Conversation routes
messagesRouter.post("/conversations", requireAuth, getOrCreateConversation);
messagesRouter.get("/conversations", requireAuth, getConversations);
messagesRouter.get("/conversations/:conversationId", requireAuth, getConversation);
messagesRouter.post("/conversations/:conversationId/read", requireAuth, markConversationAsRead);
messagesRouter.patch("/conversations/:conversationId/settings", requireAuth, updateConversationSettings);

// Message routes
messagesRouter.post("/conversations/:conversationId/messages", requireAuth, sendMessage);
messagesRouter.get("/conversations/:conversationId/messages", requireAuth, getMessages);
messagesRouter.delete("/conversations/:conversationId/messages/:messageId", requireAuth, deleteMessage);
messagesRouter.patch("/conversations/:conversationId/messages/:messageId", requireAuth, editMessage);
messagesRouter.post(
  "/conversations/:conversationId/messages/:messageId/reactions",
  requireAuth,
  toggleReaction
);
messagesRouter.post(
  "/conversations/:conversationId/messages/:messageId/view",
  requireAuth,
  markAsViewed
);

// Unread count
messagesRouter.get("/unread-count", requireAuth, getUnreadCount);

// Conversation events (video call, audio call)
messagesRouter.post("/conversations/:conversationId/events", requireAuth, startConversationEvent);
messagesRouter.get("/conversations/:conversationId/events", requireAuth, getConversationEvents);
messagesRouter.post("/conversations/:conversationId/events/:eventId/end", requireAuth, endConversationEvent);
