import type { Server as HttpServer } from "http";

import { Server, type Socket } from "socket.io";

import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { isOnline, markOffline, markOnline } from "../services/presence";

export function attachSocket(server: HttpServer) {
  const io = new Server(server, {
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
    }

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
