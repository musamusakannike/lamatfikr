"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "./socket-context";

interface Message {
  id: string;
  sender: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
    displayName?: string;
  };
  content?: string;
  media?: string[];
  createdAt: string;
}

interface ChatContextType {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Set<string>>;
  addMessage: (chatId: string, message: Message) => void;
  addMessages: (chatId: string, messages: Message[]) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  clearChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { type: string; conversationId?: string; communityId?: string; roomId?: string; message: Message }) => {
      const chatId = data.conversationId || data.communityId || data.roomId;
      if (!chatId) return;

      setMessages((prev) => {
        const existingMessages = prev[chatId] || [];
        // Check if message already exists by ID to prevent duplicates
        if (existingMessages.some((msg) => msg.id === data.message.id)) {
          return prev;
        }
        return {
          ...prev,
          [chatId]: [...existingMessages, data.message],
        };
      });
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      // This will be handled by components that know which chat is active
    };

    const handleConversationTyping = (data: { userId: string; isTyping: boolean; conversationId: string }) => {
      setTypingUsers((prev) => {
        const key = `conversation:${data.conversationId}`;
        const newTyping = new Set(prev[key] || new Set());
        
        if (data.isTyping) {
          newTyping.add(data.userId);
        } else {
          newTyping.delete(data.userId);
        }
        
        return {
          ...prev,
          [key]: newTyping,
        };
      });
    };

    const handleCommunityTyping = (data: { userId: string; isTyping: boolean; communityId: string }) => {
      setTypingUsers((prev) => {
        const key = `community:${data.communityId}`;
        const newTyping = new Set(prev[key] || new Set());
        
        if (data.isTyping) {
          newTyping.add(data.userId);
        } else {
          newTyping.delete(data.userId);
        }
        
        return {
          ...prev,
          [key]: newTyping,
        };
      });
    };

    const handleRoomTyping = (data: { userId: string; isTyping: boolean; roomId: string }) => {
      setTypingUsers((prev) => {
        const key = `room:${data.roomId}`;
        const newTyping = new Set(prev[key] || new Set());
        
        if (data.isTyping) {
          newTyping.add(data.userId);
        } else {
          newTyping.delete(data.userId);
        }
        
        return {
          ...prev,
          [key]: newTyping,
        };
      });
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:conversation", handleConversationTyping);
    socket.on("typing:community", handleCommunityTyping);
    socket.on("typing:room", handleRoomTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:conversation", handleConversationTyping);
      socket.off("typing:community", handleCommunityTyping);
      socket.off("typing:room", handleRoomTyping);
    };
  }, [socket]);

  const addMessage = (chatId: string, message: Message) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }));
  };

  const addMessages = (chatId: string, newMessages: Message[]) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), ...newMessages],
    }));
  };

  const setTyping = (chatId: string, userId: string, isTyping: boolean) => {
    setTypingUsers((prev) => {
      const newTyping = new Set(prev[chatId] || new Set());
      
      if (isTyping) {
        newTyping.add(userId);
      } else {
        newTyping.delete(userId);
      }
      
      return {
        ...prev,
        [chatId]: newTyping,
      };
    });
  };

  const clearChat = (chatId: string) => {
    setMessages((prev) => {
      const { [chatId]: _, ...rest } = prev;
      return rest;
    });
    setTypingUsers((prev) => {
      const { [chatId]: _, ...rest } = prev;
      return rest;
    });
  };

  const value: ChatContextType = {
    messages,
    typingUsers,
    addMessage,
    addMessages,
    setTyping,
    clearChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
