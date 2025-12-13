import { z } from "zod";
import { PostPrivacy, PostMediaType, VoteType } from "../models/common";

export const createPostSchema = z.object({
  contentText: z.string().max(5000).optional(),
  privacy: z.enum([
    PostPrivacy.public,
    PostPrivacy.followers,
    PostPrivacy.friends,
    PostPrivacy.friends_only,
    PostPrivacy.me_only,
  ]).default(PostPrivacy.public),
  location: z.string().max(200).optional(),
  feeling: z.string().max(100).optional(),
  media: z.array(z.object({
    type: z.enum([
      PostMediaType.image,
      PostMediaType.video,
      PostMediaType.audio,
      PostMediaType.voice_note,
      PostMediaType.file,
    ]),
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
    size: z.number().positive().optional(),
    duration: z.number().positive().optional(),
  })).max(10).optional(),
  poll: z.object({
    question: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(10),
    allowMultipleVotes: z.boolean().default(false),
    endsAt: z.string().datetime().optional(),
  }).optional(),
}).refine(
  (data) => data.contentText || (data.media && data.media.length > 0) || data.poll,
  { message: "Post must have content, media, or a poll" }
);

export const updatePostSchema = z.object({
  contentText: z.string().max(5000).optional(),
  privacy: z.enum([
    PostPrivacy.public,
    PostPrivacy.followers,
    PostPrivacy.friends,
    PostPrivacy.friends_only,
    PostPrivacy.me_only,
  ]).optional(),
  location: z.string().max(200).optional().nullable(),
  feeling: z.string().max(100).optional().nullable(),
});

export const votePostSchema = z.object({
  voteType: z.enum([VoteType.upvote, VoteType.downvote]),
});

export const votePollSchema = z.object({
  optionIds: z.array(z.string().min(1)).min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
