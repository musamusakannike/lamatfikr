import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  initiateFeaturedRoomPayment,
  verifyFeaturedRoomPayment,
  getFeaturedRooms,
  getRoomFeaturedStatus,
  cancelFeaturedRoom,
} from "../controllers/featured-room.controller";

export const featuredRoomsRouter = Router();

featuredRoomsRouter.get("/", getFeaturedRooms);

featuredRoomsRouter.use(requireAuth);

featuredRoomsRouter.post("/:roomId/initiate", initiateFeaturedRoomPayment);
featuredRoomsRouter.get("/:roomId/verify", verifyFeaturedRoomPayment);
featuredRoomsRouter.get("/:roomId/status", getRoomFeaturedStatus);
featuredRoomsRouter.delete("/:roomId/:featuredId", cancelFeaturedRoom);
