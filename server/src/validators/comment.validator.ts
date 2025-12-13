import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().optional(),
  media: z.array(z.string().url()).max(4).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});
