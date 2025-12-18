import { io, type Socket } from "socket.io-client";

function getSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  return apiUrl.endsWith("/api") ? apiUrl.slice(0, -"/api".length) : apiUrl;
}

export function createAuthedSocket(token: string): Socket {
  return io(getSocketUrl(), {
    transports: ["websocket"],
    auth: { token },
    withCredentials: true,
  });
}
