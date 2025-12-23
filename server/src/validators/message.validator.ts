import { z } from "zod";

export const createConversationSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
});

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  media: z.array(z.string().url()).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "audio"]),
        name: z.string().optional(),
        size: z.number().nonnegative().optional(),
      })
    )
    .optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      label: z.string().optional(),
    })
    .optional(),
}).refine(
  (data) =>
    !!data.content ||
    (data.media && data.media.length > 0) ||
    (data.attachments && data.attachments.length > 0) ||
    !!data.location,
  { message: "Message content or media is required" }
);

export const getMessagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const toggleReactionSchema = z.object({
  emoji: z.string().min(1),
});

export const updateConversationSettingsSchema = z.object({
  disappearingMessagesDuration: z.number().nullable(),
});

export const editMessageSchema = z.object({
  content: z.string().trim().min(1, "Content cannot be empty"),
});
