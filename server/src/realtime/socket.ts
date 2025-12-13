import type { Server as HttpServer } from "http";

import { Server, type Socket } from "socket.io";

import { env } from "../config/env";

export function attachSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("[socket] connected", socket.id);

    socket.on("disconnect", () => {
      console.log("[socket] disconnected", socket.id);
    });
  });

  return io;
}
