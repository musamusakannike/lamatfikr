import { apiClient } from "@/lib/api";

export interface MessageUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: MessageUser;
  content?: string;
  media?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  type: "private" | "group";
  participants: MessageUser[];
  lastMessageId?: {
    _id: string;
    content?: string;
    media?: string[];
    senderId: MessageUser;
    createdAt: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SendMessageData {
  content?: string;
  media?: string[];
}

export const messagesApi = {
  // Create or get existing conversation with a user
  getOrCreateConversation: (participantId: string) =>
    apiClient.post<{ conversation: Conversation }>("/messages/conversations", {
      participantId,
    }),

  // Get all conversations
  getConversations: (page = 1, limit = 20) =>
    apiClient.get<ConversationsResponse>(
      `/messages/conversations?page=${page}&limit=${limit}`
    ),

  // Get a single conversation
  getConversation: (conversationId: string) =>
    apiClient.get<{ conversation: Conversation }>(
      `/messages/conversations/${conversationId}`
    ),

  // Send a message
  sendMessage: (conversationId: string, data: SendMessageData) =>
    apiClient.post<{ message: string; data: Message }>(
      `/messages/conversations/${conversationId}/messages`,
      data
    ),

  // Get messages in a conversation
  getMessages: (conversationId: string, page = 1, limit = 50) =>
    apiClient.get<MessagesResponse>(
      `/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    ),

  // Delete a message
  deleteMessage: (conversationId: string, messageId: string) =>
    apiClient.delete<{ message: string }>(
      `/messages/conversations/${conversationId}/messages/${messageId}`
    ),

  // Mark conversation as read
  markAsRead: (conversationId: string) =>
    apiClient.post<{ message: string }>(
      `/messages/conversations/${conversationId}/read`
    ),

  // Get unread message count
  getUnreadCount: () =>
    apiClient.get<{ unreadCount: number }>("/messages/unread-count"),
};
