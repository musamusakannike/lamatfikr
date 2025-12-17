import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { CommentModel } from "../models/comment.model";
import { PostModel } from "../models/post.model";
import { ReactionModel } from "../models/reaction.model";
import { SavedItemModel } from "../models/saved-item.model";
import { BlockModel } from "../models/block.model";
import { FriendshipModel } from "../models/friendship.model";
import { FollowModel } from "../models/follow.model";
import {
  PostPrivacy,
  ReactionTargetType,
  SavedItemType,
  FriendshipStatus,
  FollowStatus,
  NotificationType,
} from "../models/common";
import { createNotification } from "../services/notification";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validators/comment.validator";

async function canViewPost(viewerId: string | undefined, post: any): Promise<boolean> {
  if (!post) return false;

  const postUserId = post.userId.toString();

  if (viewerId === postUserId) return true;

  if (post.privacy === PostPrivacy.me_only) return false;

  if (post.privacy === PostPrivacy.public) return true;

  if (!viewerId) return false;

  const isBlocked = await BlockModel.findOne({
    $or: [
      { blockerId: viewerId, blockedId: postUserId },
      { blockerId: postUserId, blockedId: viewerId },
    ],
  });
  if (isBlocked) return false;

  if (post.privacy === PostPrivacy.friends || post.privacy === PostPrivacy.friends_only) {
    const friendship = await FriendshipModel.findOne({
      $or: [
        { requesterId: viewerId, addresseeId: postUserId, status: FriendshipStatus.accepted },
        { requesterId: postUserId, addresseeId: viewerId, status: FriendshipStatus.accepted },
      ],
    });
    return !!friendship;
  }

  if (post.privacy === PostPrivacy.followers) {
    const follow = await FollowModel.findOne({
      followerId: viewerId,
      followingId: postUserId,
      status: FollowStatus.accepted,
    });
    return !!follow;
  }

  return false;
}

// ==================== COMMENT CRUD ====================

export const createComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const validation = createCommentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { content, parentCommentId, media } = validation.data;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(userId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot comment on this post" });
      return;
    }

    if (parentCommentId) {
      const parentComment = await CommentModel.findOne({
        _id: parentCommentId,
        postId,
        deletedAt: null,
      });
      if (!parentComment) {
        res.status(404).json({ message: "Parent comment not found" });
        return;
      }
    }

    const comment = await CommentModel.create({
      postId,
      userId,
      parentCommentId: parentCommentId || null,
      content,
      media: media || [],
    });

    if (parentCommentId) {
      const parentComment = await CommentModel.findById(parentCommentId).select("userId").lean();
      const recipientId = parentComment?.userId?.toString();
      if (recipientId) {
        await createNotification({
          userId: recipientId,
          actorId: userId,
          type: NotificationType.comment,
          targetId: comment._id.toString(),
          url: `/posts/${postId}`,
        });
      }
    } else {
      const postOwnerId = post.userId?.toString?.() ?? post.userId;
      if (typeof postOwnerId === "string") {
        await createNotification({
          userId: postOwnerId,
          actorId: userId,
          type: NotificationType.comment,
          targetId: comment._id.toString(),
          url: `/posts/${postId}`,
        });
      }
    }

    post.commentCount += 1;
    await post.save();

    if (parentCommentId) {
      await CommentModel.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: 1 },
      });
    }

    const populatedComment = await CommentModel.findById(comment._id)
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    res.status(201).json({
      message: "Comment created successfully",
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const viewerId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(viewerId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot view comments on this post" });
      return;
    }

    const comments = await CommentModel.find({
      postId,
      parentCommentId: null,
      deletedAt: null,
    })
      .populate("userId", "firstName lastName username avatar verified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CommentModel.countDocuments({
      postId,
      parentCommentId: null,
      deletedAt: null,
    });

    res.json({
      comments,
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

export const getReplies: RequestHandler = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const viewerId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(viewerId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot view replies on this post" });
      return;
    }

    const parentComment = await CommentModel.findOne({
      _id: commentId,
      postId,
      deletedAt: null,
    });
    if (!parentComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const replies = await CommentModel.find({
      postId,
      parentCommentId: commentId,
      deletedAt: null,
    })
      .populate("userId", "firstName lastName username avatar verified")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CommentModel.countDocuments({
      postId,
      parentCommentId: commentId,
      deletedAt: null,
    });

    res.json({
      replies,
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

export const updateComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId, commentId } = req.params;

    const validation = updateCommentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { content } = validation.data;

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      deletedAt: null,
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId.toString() !== userId) {
      res.status(403).json({ message: "You can only edit your own comments" });
      return;
    }

    comment.content = content;
    await comment.save();

    const populatedComment = await CommentModel.findById(comment._id)
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    res.json({
      message: "Comment updated successfully",
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId, commentId } = req.params;

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      deletedAt: null,
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId.toString() !== userId) {
      res.status(403).json({ message: "You can only delete your own comments" });
      return;
    }

    comment.deletedAt = new Date();
    await comment.save();

    const post = await PostModel.findById(postId);
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      await post.save();
    }

    if (comment.parentCommentId) {
      await CommentModel.findByIdAndUpdate(comment.parentCommentId, {
        $inc: { replyCount: -1 },
      });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMENT REACTIONS ====================

export const reactToComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId, commentId } = req.params;
    const { reactionType } = req.body;

    if (!reactionType || typeof reactionType !== "string") {
      res.status(400).json({ message: "Reaction type is required" });
      return;
    }

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(userId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot react to this comment" });
      return;
    }

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      deletedAt: null,
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const existingReaction = await ReactionModel.findOne({
      userId,
      targetType: ReactionTargetType.comment,
      targetId: commentId,
      deletedAt: null,
    });

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        existingReaction.deletedAt = new Date();
        await existingReaction.save();
        comment.reactionCount = Math.max(0, comment.reactionCount - 1);
        await comment.save();

        res.json({ message: "Reaction removed", userReaction: null });
        return;
      } else {
        existingReaction.reactionType = reactionType;
        await existingReaction.save();

        res.json({ message: "Reaction changed", userReaction: reactionType });
        return;
      }
    }

    await ReactionModel.create({
      userId,
      targetType: ReactionTargetType.comment,
      targetId: commentId,
      reactionType,
    });

    const commentOwnerId = comment.userId?.toString?.() ?? comment.userId;
    if (typeof commentOwnerId === "string") {
      await createNotification({
        userId: commentOwnerId,
        actorId: userId,
        type: NotificationType.like,
        targetId: commentId,
        url: `/posts/${postId}`,
      });
    }

    comment.reactionCount += 1;
    await comment.save();

    res.status(201).json({ message: "Reaction added", userReaction: reactionType });
  } catch (error) {
    next(error);
  }
};

export const removeCommentReaction: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId, commentId } = req.params;

    const reaction = await ReactionModel.findOne({
      userId,
      targetType: ReactionTargetType.comment,
      targetId: commentId,
      deletedAt: null,
    });

    if (!reaction) {
      res.status(404).json({ message: "Reaction not found" });
      return;
    }

    reaction.deletedAt = new Date();
    await reaction.save();

    await CommentModel.findByIdAndUpdate(commentId, {
      $inc: { reactionCount: -1 },
    });

    res.json({ message: "Reaction removed" });
  } catch (error) {
    next(error);
  }
};

// ==================== SAVE COMMENT ====================

export const saveComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId, commentId } = req.params;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(userId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot save this comment" });
      return;
    }

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      deletedAt: null,
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const existing = await SavedItemModel.findOne({
      userId,
      itemType: SavedItemType.comment,
      itemId: commentId,
    });

    if (existing) {
      res.status(400).json({ message: "Comment already saved" });
      return;
    }

    await SavedItemModel.create({
      userId,
      itemType: SavedItemType.comment,
      itemId: commentId,
    });

    res.status(201).json({ message: "Comment saved" });
  } catch (error) {
    next(error);
  }
};

export const unsaveComment: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { commentId } = req.params;

    const saved = await SavedItemModel.findOneAndDelete({
      userId,
      itemType: SavedItemType.comment,
      itemId: commentId,
    });

    if (!saved) {
      res.status(404).json({ message: "Saved item not found" });
      return;
    }

    res.json({ message: "Comment unsaved" });
  } catch (error) {
    next(error);
  }
};
