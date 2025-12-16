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
} from "../controllers/message.controller";

export const messagesRouter = Router();

// Conversation routes
messagesRouter.post("/conversations", requireAuth, getOrCreateConversation);
messagesRouter.get("/conversations", requireAuth, getConversations);
messagesRouter.get("/conversations/:conversationId", requireAuth, getConversation);
messagesRouter.post("/conversations/:conversationId/read", requireAuth, markConversationAsRead);

// Message routes
messagesRouter.post("/conversations/:conversationId/messages", requireAuth, sendMessage);
messagesRouter.get("/conversations/:conversationId/messages", requireAuth, getMessages);
messagesRouter.delete("/conversations/:conversationId/messages/:messageId", requireAuth, deleteMessage);

// Unread count
messagesRouter.get("/unread-count", requireAuth, getUnreadCount);
