import type { Server as HttpServer } from "http";

import { Server, type Socket } from "socket.io";

import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { isOnline, markOffline, markOnline } from "../services/presence";

export let io: Server;

export function attachSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const rawAuth = socket.handshake.auth?.token;
    const rawHeader = socket.handshake.headers?.authorization;
    const tokenFromHeader =
      typeof rawHeader === "string" && rawHeader.startsWith("Bearer ")
        ? rawHeader.slice("Bearer ".length)
        : undefined;
    const token = typeof rawAuth === "string" ? rawAuth : tokenFromHeader;

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    console.log("[socket] connected", socket.id, userId ? `user=${userId}` : "");

    if (userId) {
      const wasOnline = isOnline(userId);
      markOnline(userId);
      if (!wasOnline) {
        io.emit("presence:update", { userId, isOnline: true });
      }

      // Join user to their personal room for private messages
      socket.join(`user:${userId}`);
    }

    // Join conversation rooms for DMs
    socket.on("join:conversation", (conversationId: string) => {
      if (userId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`[socket] user ${userId} joined conversation ${conversationId}`);
      }
    });

    // Leave conversation rooms
    socket.on("leave:conversation", (conversationId: string) => {
      if (userId) {
        socket.leave(`conversation:${conversationId}`);
        console.log(`[socket] user ${userId} left conversation ${conversationId}`);
      }
    });

    // Join community rooms
    socket.on("join:community", (communityId: string) => {
      if (userId) {
        socket.join(`community:${communityId}`);
        console.log(`[socket] user ${userId} joined community ${communityId}`);
      }
    });

    // Leave community rooms
    socket.on("leave:community", (communityId: string) => {
      if (userId) {
        socket.leave(`community:${communityId}`);
        console.log(`[socket] user ${userId} left community ${communityId}`);
      }
    });

    // Join room chats
    socket.on("join:room", (roomId: string) => {
      if (userId) {
        socket.join(`room:${roomId}`);
        console.log(`[socket] user ${userId} joined room ${roomId}`);
      }
    });

    // Leave room chats
    socket.on("leave:room", (roomId: string) => {
      if (userId) {
        socket.leave(`room:${roomId}`);
        console.log(`[socket] user ${userId} left room ${roomId}`);
      }
    });

    // Handle typing indicators for conversations
    socket.on("typing:conversation", (data: { conversationId: string; isTyping: boolean }) => {
      if (userId) {
        socket.to(`conversation:${data.conversationId}`).emit("typing:conversation", {
          userId,
          isTyping: data.isTyping,
        });
      }
    });

    // Handle typing indicators for communities
    socket.on("typing:community", (data: { communityId: string; isTyping: boolean }) => {
      if (userId) {
        socket.to(`community:${data.communityId}`).emit("typing:community", {
          userId,
          isTyping: data.isTyping,
        });
      }
    });

    // Handle typing indicators for rooms
    socket.on("typing:room", (data: { roomId: string; isTyping: boolean }) => {
      if (userId) {
        socket.to(`room:${data.roomId}`).emit("typing:room", {
          userId,
          isTyping: data.isTyping,
        });
      }
    });

    socket.on("disconnect", () => {
      const disconnectedUserId = socket.data.userId as string | undefined;
      console.log(
        "[socket] disconnected",
        socket.id,
        disconnectedUserId ? `user=${disconnectedUserId}` : ""
      );

      if (disconnectedUserId) {
        const remaining = markOffline(disconnectedUserId);
        if (remaining === 0) {
          io.emit("presence:update", { userId: disconnectedUserId, isOnline: false });
        }
      }
    });
  });

  return io;
}
