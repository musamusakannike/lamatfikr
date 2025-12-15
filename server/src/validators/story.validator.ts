import { z } from "zod";

export const createStorySchema = z.object({
  media: z.array(z.string().url()).min(1).max(10),
  expiresInHours: z.number().int().positive().max(48).default(24),
});

export const storyPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const storyFilterSchema = z.object({
  mediaType: z.enum(["all", "images", "videos"]).default("all"),
});
