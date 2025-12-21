import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { ReelModel } from "../models/reel.model";
import { ReelLikeModel } from "../models/reel-like.model";
import { ReelViewModel } from "../models/reel-view.model";
import { CommentModel } from "../models/comment.model";
import { UserModel } from "../models/user.model";
import { FriendshipModel } from "../models/friendship.model";
import { FollowModel } from "../models/follow.model";
import { BlockModel } from "../models/block.model";
import { MuteModel } from "../models/mute.model";
import { HashtagModel } from "../models/hashtag.model";
import { MentionModel } from "../models/mention.model";
import {
  PostPrivacy,
  FriendshipStatus,
  FollowStatus,
  NotificationType,
} from "../models/common";
import { createNotification } from "../services/notification";
import { parseContent } from "../utils/content-parser";

const createReelSchema = z.object({
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(2200).optional(),
  duration: z.number().positive(),
  privacy: z.enum([
    PostPrivacy.public,
    PostPrivacy.followers,
    PostPrivacy.friends,
    PostPrivacy.friends_only,
    PostPrivacy.me_only,
  ]).default(PostPrivacy.public),
  location: z.string().max(100).optional(),
  feeling: z.string().max(50).optional(),
});

const updateReelSchema = z.object({
  caption: z.string().max(2200).optional(),
  privacy: z.enum([
    PostPrivacy.public,
    PostPrivacy.followers,
    PostPrivacy.friends,
    PostPrivacy.friends_only,
    PostPrivacy.me_only,
  ]).optional(),
  location: z.string().max(100).optional(),
  feeling: z.string().max(50).optional(),
});

async function processHashtagsAndMentions(reelId: Types.ObjectId, caption: string | undefined) {
  const { hashtags, mentions } = parseContent(caption);

  if (hashtags.length > 0) {
    const hashtagDocs = await Promise.all(
      hashtags.map(async (tag) => {
        const hashtag = await HashtagModel.findOneAndUpdate(
          { tag },
          { $inc: { postCount: 1 }, $set: { lastUsedAt: new Date() } },
          { upsert: true, new: true }
        );
        return hashtag;
      })
    );
  }

  if (mentions.length > 0) {
    const mentionedUsers = await UserModel.find({
      username: { $in: mentions },
    }).select("_id");

    if (mentionedUsers.length > 0) {
      await MentionModel.insertMany(
        mentionedUsers.map((u) => ({ postId: reelId, mentionedUserId: u._id })),
        { ordered: false }
      ).catch(() => {});
    }
  }
}

async function canViewReel(viewerId: string | undefined, reel: any): Promise<boolean> {
  if (!reel) return false;

  const reelUserId = reel.userId.toString();

  if (viewerId === reelUserId) return true;

  if (reel.privacy === PostPrivacy.me_only) return false;

  if (reel.privacy === PostPrivacy.public) return true;

  if (!viewerId) return false;

  const isBlocked = await BlockModel.findOne({
    $or: [
      { blockerId: viewerId, blockedId: reelUserId },
      { blockerId: reelUserId, blockedId: viewerId },
    ],
  });
  if (isBlocked) return false;

  if (reel.privacy === PostPrivacy.friends || reel.privacy === PostPrivacy.friends_only) {
    const friendship = await FriendshipModel.findOne({
      $or: [
        { requesterId: viewerId, addresseeId: reelUserId, status: FriendshipStatus.accepted },
        { requesterId: reelUserId, addresseeId: viewerId, status: FriendshipStatus.accepted },
      ],
    });
    return !!friendship;
  }

  if (reel.privacy === PostPrivacy.followers) {
    const follow = await FollowModel.findOne({
      followerId: viewerId,
      followingId: reelUserId,
      status: FollowStatus.accepted,
    });
    return !!follow;
  }

  return false;
}

export const createReel: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = createReelSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { videoUrl, thumbnailUrl, caption, duration, privacy, location, feeling } = validation.data;

    const reel = await ReelModel.create({
      userId,
      videoUrl,
      thumbnailUrl,
      caption,
      duration,
      privacy,
      location,
      feeling,
    });

    await processHashtagsAndMentions(reel._id as Types.ObjectId, caption);

    if (caption) {
      const { mentions } = parseContent(caption);
      if (mentions.length > 0) {
        const mentionedUsers = await UserModel.find({ username: { $in: mentions } })
          .select("_id")
          .lean();

        await Promise.all(
          mentionedUsers.map((u) =>
            createNotification({
              userId: u._id.toString(),
              actorId: userId,
              type: NotificationType.mention,
              targetId: reel._id.toString(),
              url: `/reels/${reel._id.toString()}`,
            })
          )
        );
      }
    }

    const populatedReel = await ReelModel.findById(reel._id)
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    res.status(201).json({
      message: "Reel created successfully",
      reel: populatedReel,
    });
  } catch (error) {
    next(error);
  }
};

export const getReelsFeed: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const now = Date.now();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [friendships, following, blocked, muted] = await Promise.all([
      FriendshipModel.find({
        $or: [
          { requesterId: userId, status: FriendshipStatus.accepted },
          { addresseeId: userId, status: FriendshipStatus.accepted },
        ],
      }).lean(),
      FollowModel.find({ followerId: userId, status: FollowStatus.accepted }).lean(),
      BlockModel.find({
        $or: [{ blockerId: userId }, { blockedId: userId }],
      }).lean(),
      MuteModel.find({
        muterId: userId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).lean(),
    ]);

    const friendIds = friendships.map((f) =>
      f.requesterId.toString() === userId ? f.addresseeId.toString() : f.requesterId.toString()
    );
    const followingIds = following.map((f) => f.followingId.toString());
    const blockedIds = blocked.map((b) =>
      b.blockerId.toString() === userId ? b.blockedId.toString() : b.blockerId.toString()
    );
    const mutedIds = muted.map((m) => m.mutedId.toString());

    const excludeIds = [...new Set([...blockedIds, ...mutedIds])];

    const reels = await ReelModel.find({
      deletedAt: null,
      userId: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) },
      $or: [
        { userId },
        { privacy: PostPrivacy.public },
        {
          privacy: { $in: [PostPrivacy.friends, PostPrivacy.friends_only] },
          userId: { $in: friendIds.map((id) => new Types.ObjectId(id)) },
        },
        {
          privacy: PostPrivacy.followers,
          userId: { $in: followingIds.map((id) => new Types.ObjectId(id)) },
        },
      ],
    })
      .populate("userId", "firstName lastName username avatar verified paidVerifiedUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const reelIds = reels.map((r) => r._id);

    const [userLikes, userViews] = await Promise.all([
      ReelLikeModel.find({ userId, reelId: { $in: reelIds } }).lean(),
      ReelViewModel.find({ userId, reelId: { $in: reelIds } }).lean(),
    ]);

    const likesByReel = new Set(userLikes.map((l) => l.reelId.toString()));
    const viewsByReel = new Set(userViews.map((v) => v.reelId.toString()));

    const enrichedReels = reels.map((reel) => {
      const populatedUser: any = reel.userId;
      const paidUntil = populatedUser?.paidVerifiedUntil;
      const paidUntilMs = paidUntil ? new Date(paidUntil).getTime() : 0;
      const effectiveVerified = !!populatedUser?.verified || paidUntilMs > now;

      return {
        ...reel,
        userId:
          populatedUser && typeof populatedUser === "object"
            ? { ...populatedUser, verified: effectiveVerified }
            : reel.userId,
        userLiked: likesByReel.has(reel._id.toString()),
        userViewed: viewsByReel.has(reel._id.toString()),
      };
    });

    const total = await ReelModel.countDocuments({
      deletedAt: null,
      userId: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) },
      $or: [
        { userId },
        { privacy: PostPrivacy.public },
        {
          privacy: { $in: [PostPrivacy.friends, PostPrivacy.friends_only] },
          userId: { $in: friendIds.map((id) => new Types.ObjectId(id)) },
        },
        {
          privacy: PostPrivacy.followers,
          userId: { $in: followingIds.map((id) => new Types.ObjectId(id)) },
        },
      ],
    });

    res.json({
      reels: enrichedReels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReel: RequestHandler = async (req, res, next) => {
  try {
    const { reelId } = req.params;
    const viewerId = req.userId;

    const reel = await ReelModel.findOne({ _id: reelId, deletedAt: null })
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    if (!reel) {
      res.status(404).json({ message: "Reel not found" });
      return;
    }

    const canView = await canViewReel(viewerId, reel);
    if (!canView) {
      res.status(403).json({ message: "You do not have permission to view this reel" });
      return;
    }

    const [userLike, userView] = await Promise.all([
      viewerId ? ReelLikeModel.findOne({ userId: viewerId, reelId }).lean() : null,
      viewerId ? ReelViewModel.findOne({ userId: viewerId, reelId }).lean() : null,
    ]);

    res.json({
      reel: {
        ...reel,
        userLiked: !!userLike,
        userViewed: !!userView,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReel: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { reelId } = req.params;

    const validation = updateReelSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const reel = await ReelModel.findOne({ _id: reelId, deletedAt: null });
    if (!reel) {
      res.status(404).json({ message: "Reel not found" });
      return;
    }

    if (reel.userId.toString() !== userId) {
      res.status(403).json({ message: "You can only edit your own reels" });
      return;
    }

    const { caption, privacy, location, feeling } = validation.data;

    if (caption !== undefined) reel.caption = caption;
    if (privacy !== undefined) reel.privacy = privacy;
    if (location !== undefined) reel.location = location || undefined;
    if (feeling !== undefined) reel.feeling = feeling || undefined;

    await reel.save();

    if (caption !== undefined) {
      await MentionModel.deleteMany({ postId: reelId });
      await processHashtagsAndMentions(reel._id as Types.ObjectId, caption);
    }

    res.json({
      message: "Reel updated successfully",
      reel,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReel: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { reelId } = req.params;

    const reel = await ReelModel.findOne({ _id: reelId, deletedAt: null });
    if (!reel) {
      res.status(404).json({ message: "Reel not found" });
      return;
    }

    if (reel.userId.toString() !== userId) {
      res.status(403).json({ message: "You can only delete your own reels" });
      return;
    }

    reel.deletedAt = new Date();
    await reel.save();

    res.json({ message: "Reel deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const likeReel: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { reelId } = req.params;

    const reel = await ReelModel.findOne({ _id: reelId, deletedAt: null });
    if (!reel) {
      res.status(404).json({ message: "Reel not found" });
      return;
    }

    const canView = await canViewReel(userId, reel);
    if (!canView) {
      res.status(403).json({ message: "You cannot like this reel" });
      return;
    }

    const existingLike = await ReelLikeModel.findOne({ userId, reelId });

    if (existingLike) {
      await existingLike.deleteOne();
      reel.likeCount = Math.max(0, reel.likeCount - 1);
      await reel.save();

      res.json({ message: "Like removed", liked: false });
      return;
    }

    await ReelLikeModel.create({ userId, reelId });
    reel.likeCount += 1;
    await reel.save();

    const reelOwnerId = reel.userId?.toString?.() ?? reel.userId;
    if (typeof reelOwnerId === "string" && reelOwnerId !== userId) {
      await createNotification({
        userId: reelOwnerId,
        actorId: userId,
        type: NotificationType.like,
        targetId: reelId,
        url: `/reels/${reelId}`,
      });
    }

    res.json({ message: "Reel liked", liked: true });
  } catch (error) {
    next(error);
  }
};

export const recordReelView: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { reelId } = req.params;
    const { watchDuration } = req.body;

    const reel = await ReelModel.findOne({ _id: reelId, deletedAt: null });
    if (!reel) {
      res.status(404).json({ message: "Reel not found" });
      return;
    }

    const canView = await canViewReel(userId, reel);
    if (!canView) {
      res.status(403).json({ message: "You cannot view this reel" });
      return;
    }

    const existingView = userId
      ? await ReelViewModel.findOne({ userId, reelId })
      : null;

    if (!existingView) {
      await ReelViewModel.create({
        userId: userId || undefined,
        reelId,
        watchDuration: watchDuration || 0,
      });

      reel.viewCount += 1;
      await reel.save();
    }

    res.json({ message: "View recorded" });
  } catch (error) {
    next(error);
  }
};

export const getUserReels: RequestHandler = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const viewerId = req.userId;

    const now = Date.now();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let privacyFilter: any = { privacy: PostPrivacy.public };

    if (viewerId) {
      if (viewerId === targetUserId) {
        privacyFilter = {};
      } else {
        const isBlocked = await BlockModel.findOne({
          $or: [
            { blockerId: viewerId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: viewerId },
          ],
        });

        if (isBlocked) {
          res.status(403).json({ message: "Cannot view this user's reels" });
          return;
        }

        const isFriend = await FriendshipModel.findOne({
          $or: [
            { requesterId: viewerId, addresseeId: targetUserId, status: FriendshipStatus.accepted },
            { requesterId: targetUserId, addresseeId: viewerId, status: FriendshipStatus.accepted },
          ],
        });

        const isFollowing = await FollowModel.findOne({
          followerId: viewerId,
          followingId: targetUserId,
          status: FollowStatus.accepted,
        });

        const allowedPrivacies: string[] = [PostPrivacy.public];
        if (isFriend) {
          allowedPrivacies.push(PostPrivacy.friends, PostPrivacy.friends_only);
        }
        if (isFollowing) {
          allowedPrivacies.push(PostPrivacy.followers);
        }

        privacyFilter = { privacy: { $in: allowedPrivacies } };
      }
    }

    const reels = await ReelModel.find({
      userId: targetUserId,
      deletedAt: null,
      ...privacyFilter,
    })
      .populate("userId", "firstName lastName username avatar verified paidVerifiedUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const reelsWithEffectiveVerified = reels.map((reel: any) => {
      const populatedUser: any = reel.userId;
      const paidUntil = populatedUser?.paidVerifiedUntil;
      const paidUntilMs = paidUntil ? new Date(paidUntil).getTime() : 0;
      const effectiveVerified = !!populatedUser?.verified || paidUntilMs > now;

      return {
        ...reel,
        userId:
          populatedUser && typeof populatedUser === "object"
            ? { ...populatedUser, verified: effectiveVerified }
            : reel.userId,
      };
    });

    const reelIds = reelsWithEffectiveVerified.map((r) => r._id);

    const [userLikes] = await Promise.all([
      viewerId ? ReelLikeModel.find({ userId: viewerId, reelId: { $in: reelIds } }).lean() : [],
    ]);

    const likesByReel = new Set(userLikes.map((l) => l.reelId.toString()));

    const enrichedReels = reelsWithEffectiveVerified.map((reel: any) => ({
      ...reel,
      userLiked: likesByReel.has(reel._id.toString()),
    }));

    const total = await ReelModel.countDocuments({
      userId: targetUserId,
      deletedAt: null,
      ...privacyFilter,
    });

    res.json({
      reels: enrichedReels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
