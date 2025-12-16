import { z } from "zod";

export const createConversationSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
});

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  media: z.array(z.string().url()).optional(),
}).refine(
  (data) => data.content || (data.media && data.media.length > 0),
  { message: "Message content or media is required" }
);

export const getMessagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
