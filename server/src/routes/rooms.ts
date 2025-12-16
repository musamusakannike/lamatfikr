import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  createRoom,
  getRooms,
  getRoom,
  joinFreeRoom,
  initiatePaidRoomJoin,
  verifyPaymentAndJoin,
  leaveRoom,
  deleteRoom,
  updateRoom,
  getRoomMembers,
  sendMessage,
  getMessages,
  handleMembershipRequest,
  getPendingRequests,
  generateInviteLink,
  getRoomInviteLinks,
  revokeInviteLink,
  joinRoomViaInviteLink,
} from "../controllers/room.controller";

export const roomsRouter = Router();

// All routes require authentication
roomsRouter.use(requireAuth);

// Room CRUD
roomsRouter.post("/", createRoom);
roomsRouter.get("/", getRooms);
roomsRouter.get("/:roomId", getRoom);
roomsRouter.patch("/:roomId", updateRoom);
roomsRouter.delete("/:roomId", deleteRoom);

// Membership
roomsRouter.post("/:roomId/join", joinFreeRoom);
roomsRouter.post("/:roomId/join/pay", initiatePaidRoomJoin);
roomsRouter.get("/:roomId/join/verify", verifyPaymentAndJoin);
roomsRouter.post("/:roomId/leave", leaveRoom);

// Members management
roomsRouter.get("/:roomId/members", getRoomMembers);
roomsRouter.get("/:roomId/requests", getPendingRequests);
roomsRouter.post("/:roomId/requests/:memberId", handleMembershipRequest);

// Messages
roomsRouter.post("/:roomId/messages", sendMessage);
roomsRouter.get("/:roomId/messages", getMessages);

// Invite links (private rooms)
roomsRouter.post("/:roomId/invite-links", generateInviteLink);
roomsRouter.get("/:roomId/invite-links", getRoomInviteLinks);
roomsRouter.delete("/:roomId/invite-links/:linkId", revokeInviteLink);
roomsRouter.post("/invite/:token/join", joinRoomViaInviteLink);
