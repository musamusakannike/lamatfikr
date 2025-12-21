"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { createAuthedSocket } from "@/lib/socket";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  joinCommunity: (communityId: string) => void;
  leaveCommunity: (communityId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendTyping: (type: "conversation" | "community" | "room", id: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!token) {
      const cleanupSocket = () => {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }
      };
      cleanupSocket();
      return;
    }

    // Use setTimeout to avoid synchronous setState
    const timeoutId = setTimeout(() => {
      const newSocket = createAuthedSocket(token);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("[socket] connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      });

      newSocket.on("disconnect", () => {
        console.log("[socket] disconnected");
        setIsConnected(false);

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectAttempts.current++;
          console.log(`[socket] reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          setTimeout(() => {
            newSocket.connect();
          }, delay);
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("[socket] connection error", error);
        setIsConnected(false);
      });
    });

    return () => {
      clearTimeout(timeoutId);
      if (socket) {
        socket.close();
      }
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const joinConversation = (conversationId: string) => {
    socket?.emit("join:conversation", conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socket?.emit("leave:conversation", conversationId);
  };

  const joinCommunity = (communityId: string) => {
    socket?.emit("join:community", communityId);
  };

  const leaveCommunity = (communityId: string) => {
    socket?.emit("leave:community", communityId);
  };

  const joinRoom = (roomId: string) => {
    socket?.emit("join:room", roomId);
  };

  const leaveRoom = (roomId: string) => {
    socket?.emit("leave:room", roomId);
  };

  const sendTyping = (type: "conversation" | "community" | "room", id: string, isTyping: boolean) => {
    socket?.emit(`typing:${type}`, { [`${type}Id`]: id, isTyping });
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    joinCommunity,
    leaveCommunity,
    joinRoom,
    leaveRoom,
    sendTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
