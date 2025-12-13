import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  addresseeId: z.string().min(1, "Addressee ID is required"),
});

export const respondFriendRequestSchema = z.object({
  requesterId: z.string().min(1, "Requester ID is required"),
  accept: z.boolean(),
});

export const followUserSchema = z.object({
  followingId: z.string().min(1, "User ID to follow is required"),
});

export const unfollowUserSchema = z.object({
  followingId: z.string().min(1, "User ID to unfollow is required"),
});

export const blockUserSchema = z.object({
  blockedId: z.string().min(1, "User ID to block is required"),
  reason: z.string().max(500).optional(),
});

export const unblockUserSchema = z.object({
  blockedId: z.string().min(1, "User ID to unblock is required"),
});

export const muteUserSchema = z.object({
  mutedId: z.string().min(1, "User ID to mute is required"),
  duration: z.number().positive().optional(),
});

export const unmuteUserSchema = z.object({
  mutedId: z.string().min(1, "User ID to unmute is required"),
});
