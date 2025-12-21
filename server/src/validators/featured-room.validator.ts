import { z } from "zod";

export const initiateFeaturedRoomSchema = z.object({
  body: z.object({
    days: z.number().int().min(1).max(365),
    currency: z.string().optional().default("OMR"),
  }),
  params: z.object({
    roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid room ID"),
  }),
});

export const verifyFeaturedRoomSchema = z.object({
  params: z.object({
    roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid room ID"),
  }),
  query: z.object({
    tap_id: z.string().min(1),
  }),
});

export const cancelFeaturedRoomSchema = z.object({
  params: z.object({
    roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid room ID"),
    featuredId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid featured ID"),
  }),
});

export const getFeaturedRoomsSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
  }),
});
