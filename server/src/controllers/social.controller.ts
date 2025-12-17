import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { FriendshipModel } from "../models/friendship.model";
import { FollowModel } from "../models/follow.model";
import { BlockModel } from "../models/block.model";
import { MuteModel } from "../models/mute.model";
import { UserModel } from "../models/user.model";
import { FriendshipStatus, FollowStatus, NotificationType } from "../models/common";
import { createNotification } from "../services/notification";
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  followUserSchema,
  unfollowUserSchema,
  blockUserSchema,
  unblockUserSchema,
  muteUserSchema,
  unmuteUserSchema,
} from "../validators/social.validator";

// ==================== FRIENDSHIP ====================

export const sendFriendRequest: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = sendFriendRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { addresseeId } = validation.data;

    if (userId === addresseeId) {
      res.status(400).json({ message: "Cannot send friend request to yourself" });
      return;
    }

    const addressee = await UserModel.findById(addresseeId);
    if (!addressee) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isBlocked = await BlockModel.findOne({
      $or: [
        { blockerId: userId, blockedId: addresseeId },
        { blockerId: addresseeId, blockedId: userId },
      ],
    });
    if (isBlocked) {
      res.status(403).json({ message: "Cannot send friend request to this user" });
      return;
    }

    const existingFriendship = await FriendshipModel.findOne({
      $or: [
        { requesterId: userId, addresseeId },
        { requesterId: addresseeId, addresseeId: userId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.accepted) {
        res.status(400).json({ message: "Already friends with this user" });
        return;
      }
      if (existingFriendship.status === FriendshipStatus.pending) {
        res.status(400).json({ message: "Friend request already pending" });
        return;
      }
    }

    const friendship = await FriendshipModel.create({
      requesterId: userId,
      addresseeId,
      status: FriendshipStatus.pending,
    });

    await createNotification({
      userId: addresseeId,
      actorId: userId,
      type: NotificationType.friend_request,
      targetId: friendship._id.toString(),
      url: `/user/${addressee.username}`,
    });

    res.status(201).json({
      message: "Friend request sent",
      friendship,
    });
  } catch (error) {
    next(error);
  }
};

export const respondToFriendRequest: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = respondFriendRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { requesterId, accept } = validation.data;

    const friendship = await FriendshipModel.findOne({
      requesterId,
      addresseeId: userId,
      status: FriendshipStatus.pending,
    });

    if (!friendship) {
      res.status(404).json({ message: "Friend request not found" });
      return;
    }

    friendship.status = accept ? FriendshipStatus.accepted : FriendshipStatus.rejected;
    friendship.respondedAt = new Date();
    await friendship.save();

    if (accept) {
      const requester = await UserModel.findById(requesterId).select("username");
      if (requester?.username) {
        await createNotification({
          userId: requesterId,
          actorId: userId,
          type: NotificationType.friend_accept,
          targetId: friendship._id.toString(),
          url: `/user/${requester.username}`,
        });
      }
    }

    res.json({
      message: accept ? "Friend request accepted" : "Friend request rejected",
      friendship,
    });
  } catch (error) {
    next(error);
  }
};

export const unfriend: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { friendId } = req.params;

    const friendship = await FriendshipModel.findOneAndDelete({
      $or: [
        { requesterId: userId, addresseeId: friendId, status: FriendshipStatus.accepted },
        { requesterId: friendId, addresseeId: userId, status: FriendshipStatus.accepted },
      ],
    });

    if (!friendship) {
      res.status(404).json({ message: "Friendship not found" });
      return;
    }

    res.json({ message: "Unfriended successfully" });
  } catch (error) {
    next(error);
  }
};

export const getFriends: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const friendships = await FriendshipModel.find({
      $or: [
        { requesterId: userId, status: FriendshipStatus.accepted },
        { addresseeId: userId, status: FriendshipStatus.accepted },
      ],
    })
      .skip(skip)
      .limit(limit)
      .lean();

    const friendIds = friendships.map((f) =>
      f.requesterId.toString() === userId ? f.addresseeId : f.requesterId
    );

    const friends = await UserModel.find({ _id: { $in: friendIds } })
      .select("firstName lastName username avatar verified")
      .lean();

    const total = await FriendshipModel.countDocuments({
      $or: [
        { requesterId: userId, status: FriendshipStatus.accepted },
        { addresseeId: userId, status: FriendshipStatus.accepted },
      ],
    });

    res.json({
      friends,
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

export const getPendingFriendRequests: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const requests = await FriendshipModel.find({
      addresseeId: userId,
      status: FriendshipStatus.pending,
    })
      .populate("requesterId", "firstName lastName username avatar verified")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await FriendshipModel.countDocuments({
      addresseeId: userId,
      status: FriendshipStatus.pending,
    });

    res.json({
      requests,
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

export const getSentFriendRequests: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const requests = await FriendshipModel.find({
      requesterId: userId,
      status: FriendshipStatus.pending,
    })
      .populate("addresseeId", "firstName lastName username avatar verified")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await FriendshipModel.countDocuments({
      requesterId: userId,
      status: FriendshipStatus.pending,
    });

    res.json({
      requests,
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

// ==================== FOLLOW ====================

export const followUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = followUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { followingId } = validation.data;

    if (userId === followingId) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    const targetUser = await UserModel.findById(followingId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isBlocked = await BlockModel.findOne({
      $or: [
        { blockerId: userId, blockedId: followingId },
        { blockerId: followingId, blockedId: userId },
      ],
    });
    if (isBlocked) {
      res.status(403).json({ message: "Cannot follow this user" });
      return;
    }

    const existingFollow = await FollowModel.findOne({
      followerId: userId,
      followingId,
    });

    if (existingFollow) {
      res.status(400).json({ message: "Already following this user" });
      return;
    }

    const follow = await FollowModel.create({
      followerId: userId,
      followingId,
      status: FollowStatus.accepted,
    });

    await createNotification({
      userId: followingId,
      actorId: userId,
      type: NotificationType.follow,
      targetId: follow._id.toString(),
      url: `/user/${targetUser.username}`,
    });

    res.status(201).json({
      message: "Now following user",
      follow,
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = unfollowUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { followingId } = validation.data;

    const follow = await FollowModel.findOneAndDelete({
      followerId: userId,
      followingId,
    });

    if (!follow) {
      res.status(404).json({ message: "Not following this user" });
      return;
    }

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    next(error);
  }
};

export const getFollowers: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const follows = await FollowModel.find({
      followingId: userId,
      status: FollowStatus.accepted,
    })
      .populate("followerId", "firstName lastName username avatar verified")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await FollowModel.countDocuments({
      followingId: userId,
      status: FollowStatus.accepted,
    });

    res.json({
      followers: follows.map((f) => f.followerId),
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

export const getFollowing: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const follows = await FollowModel.find({
      followerId: userId,
      status: FollowStatus.accepted,
    })
      .populate("followingId", "firstName lastName username avatar verified")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await FollowModel.countDocuments({
      followerId: userId,
      status: FollowStatus.accepted,
    });

    res.json({
      following: follows.map((f) => f.followingId),
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

export const checkFollowStatus: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { targetUserId } = req.params;

    if (!targetUserId) {
      res.status(400).json({ message: "Target user ID is required" });
      return;
    }

    if (userId === targetUserId) {
      res.json({ isFollowing: false, isOwnProfile: true });
      return;
    }

    const follow = await FollowModel.findOne({
      followerId: userId,
      followingId: targetUserId,
      status: FollowStatus.accepted,
    });

    res.json({
      isFollowing: !!follow,
      isOwnProfile: false,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BLOCK ====================

export const blockUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = blockUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { blockedId, reason } = validation.data;

    if (userId === blockedId) {
      res.status(400).json({ message: "Cannot block yourself" });
      return;
    }

    const targetUser = await UserModel.findById(blockedId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existingBlock = await BlockModel.findOne({
      blockerId: userId,
      blockedId,
    });

    if (existingBlock) {
      res.status(400).json({ message: "User already blocked" });
      return;
    }

    await Promise.all([
      BlockModel.create({ blockerId: userId, blockedId, reason }),
      FollowModel.deleteMany({
        $or: [
          { followerId: userId, followingId: blockedId },
          { followerId: blockedId, followingId: userId },
        ],
      }),
      FriendshipModel.deleteMany({
        $or: [
          { requesterId: userId, addresseeId: blockedId },
          { requesterId: blockedId, addresseeId: userId },
        ],
      }),
    ]);

    res.status(201).json({ message: "User blocked successfully" });
  } catch (error) {
    next(error);
  }
};

export const unblockUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = unblockUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { blockedId } = validation.data;

    const block = await BlockModel.findOneAndDelete({
      blockerId: userId,
      blockedId,
    });

    if (!block) {
      res.status(404).json({ message: "User not blocked" });
      return;
    }

    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const blocks = await BlockModel.find({ blockerId: userId })
      .populate("blockedId", "firstName lastName username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await BlockModel.countDocuments({ blockerId: userId });

    res.json({
      blockedUsers: blocks.map((b) => b.blockedId),
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

// ==================== MUTE ====================

export const muteUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = muteUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { mutedId, duration } = validation.data;

    if (userId === mutedId) {
      res.status(400).json({ message: "Cannot mute yourself" });
      return;
    }

    const targetUser = await UserModel.findById(mutedId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const expiresAt = duration ? new Date(Date.now() + duration * 1000) : undefined;

    const mute = await MuteModel.findOneAndUpdate(
      { muterId: userId, mutedId },
      { muterId: userId, mutedId, expiresAt },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: "User muted successfully",
      mute,
    });
  } catch (error) {
    next(error);
  }
};

export const unmuteUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = unmuteUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { mutedId } = validation.data;

    const mute = await MuteModel.findOneAndDelete({
      muterId: userId,
      mutedId,
    });

    if (!mute) {
      res.status(404).json({ message: "User not muted" });
      return;
    }

    res.json({ message: "User unmuted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getMutedUsers: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const mutes = await MuteModel.find({ muterId: userId })
      .populate("mutedId", "firstName lastName username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await MuteModel.countDocuments({ muterId: userId });

    res.json({
      mutedUsers: mutes.map((m) => ({
        user: m.mutedId,
        expiresAt: m.expiresAt,
      })),
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

// ==================== HELPERS ====================

export const checkFriendship = async (userId1: string, userId2: string): Promise<boolean> => {
  const friendship = await FriendshipModel.findOne({
    $or: [
      { requesterId: userId1, addresseeId: userId2, status: FriendshipStatus.accepted },
      { requesterId: userId2, addresseeId: userId1, status: FriendshipStatus.accepted },
    ],
  });
  return !!friendship;
};

export const checkFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const follow = await FollowModel.findOne({
    followerId,
    followingId,
    status: FollowStatus.accepted,
  });
  return !!follow;
};

export const checkBlocked = async (userId1: string, userId2: string): Promise<boolean> => {
  const block = await BlockModel.findOne({
    $or: [
      { blockerId: userId1, blockedId: userId2 },
      { blockerId: userId2, blockedId: userId1 },
    ],
  });
  return !!block;
};

export const checkMuted = async (muterId: string, mutedId: string): Promise<boolean> => {
  const mute = await MuteModel.findOne({
    muterId,
    mutedId,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  });
  return !!mute;
};
