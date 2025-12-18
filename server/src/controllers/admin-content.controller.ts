import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { CommentModel } from "../models/comment.model";
import { PostModel } from "../models/post.model";
import { PostMediaModel } from "../models/post-media.model";
import { StoryModel } from "../models/story.model";

function parseIntParam(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStatus(value: unknown): "active" | "deleted" | "all" {
  if (value === "deleted" || value === "active" || value === "all") return value;
  return "active";
}

export const listAdminPosts: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseIntParam(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseIntParam(req.query.limit, 20)));
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = normalizeStatus(req.query.status);

    const filter: Record<string, any> = {};
    if (status === "active") filter.deletedAt = null;
    if (status === "deleted") filter.deletedAt = { $ne: null };
    if (q) {
      filter.$or = [
        { contentText: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { feeling: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [total, posts] = await Promise.all([
      PostModel.countDocuments(filter),
      PostModel.find(filter)
        .populate("userId", "firstName lastName username avatar verified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const postIds = posts.map((p) => p._id);
    const mediaCounts = await PostMediaModel.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const mediaCountByPostId = new Map<string, number>();
    for (const row of mediaCounts) {
      mediaCountByPostId.set(String(row._id), Number(row.count ?? 0));
    }

    res.json({
      posts: posts.map((p: any) => ({
        ...p,
        mediaCount: mediaCountByPostId.get(String(p._id)) ?? 0,
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

export const adminDeletePost: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (!post.deletedAt) {
      post.deletedAt = new Date();
      await post.save();
      await PostMediaModel.updateMany({ postId }, { deletedAt: new Date() });
    }

    res.json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

export const adminRestorePost: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.deletedAt) {
      post.deletedAt = null;
      await post.save();
      await PostMediaModel.updateMany({ postId }, { deletedAt: null });
    }

    res.json({ message: "Post restored" });
  } catch (error) {
    next(error);
  }
};

export const listAdminComments: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseIntParam(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseIntParam(req.query.limit, 20)));
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = normalizeStatus(req.query.status);

    const filter: Record<string, any> = {};
    if (status === "active") filter.deletedAt = null;
    if (status === "deleted") filter.deletedAt = { $ne: null };
    if (q) {
      filter.content = { $regex: q, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [total, comments] = await Promise.all([
      CommentModel.countDocuments(filter),
      CommentModel.find(filter)
        .populate("userId", "firstName lastName username avatar verified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

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

export const adminDeleteComment: RequestHandler = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    if (!Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: "Invalid comment ID" });
      return;
    }

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (!comment.deletedAt) {
      comment.deletedAt = new Date();
      await comment.save();

      const post = await PostModel.findById(comment.postId);
      if (post) {
        post.commentCount = Math.max(0, post.commentCount - 1);
        await post.save();
      }

      if (comment.parentCommentId) {
        await CommentModel.findByIdAndUpdate(comment.parentCommentId, { $inc: { replyCount: -1 } });
      }
    }

    res.json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreComment: RequestHandler = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    if (!Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: "Invalid comment ID" });
      return;
    }

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.deletedAt) {
      comment.deletedAt = null;
      await comment.save();

      const post = await PostModel.findById(comment.postId);
      if (post) {
        post.commentCount += 1;
        await post.save();
      }

      if (comment.parentCommentId) {
        await CommentModel.findByIdAndUpdate(comment.parentCommentId, { $inc: { replyCount: 1 } });
      }
    }

    res.json({ message: "Comment restored" });
  } catch (error) {
    next(error);
  }
};

export const listAdminStories: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseIntParam(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseIntParam(req.query.limit, 20)));
    const status = normalizeStatus(req.query.status);

    const filter: Record<string, any> = {};
    if (status === "active") filter.deletedAt = null;
    if (status === "deleted") filter.deletedAt = { $ne: null };

    const skip = (page - 1) * limit;
    const [total, stories] = await Promise.all([
      StoryModel.countDocuments(filter),
      StoryModel.find(filter)
        .populate("userId", "firstName lastName username avatar verified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      stories,
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

export const adminDeleteStory: RequestHandler = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: "Invalid story ID" });
      return;
    }

    const story = await StoryModel.findById(storyId);
    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    if (!story.deletedAt) {
      story.deletedAt = new Date();
      await story.save();
    }

    res.json({ message: "Story deleted" });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreStory: RequestHandler = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: "Invalid story ID" });
      return;
    }

    const story = await StoryModel.findById(storyId);
    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    if (story.deletedAt) {
      story.deletedAt = null;
      await story.save();
    }

    res.json({ message: "Story restored" });
  } catch (error) {
    next(error);
  }
};

export const listAdminMedia: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseIntParam(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseIntParam(req.query.limit, 20)));
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = normalizeStatus(req.query.status);
    const type = typeof req.query.type === "string" ? req.query.type : "all";

    const filter: Record<string, any> = {};
    if (status === "active") filter.deletedAt = null;
    if (status === "deleted") filter.deletedAt = { $ne: null };
    if (type !== "all") filter.type = type;
    if (q) filter.url = { $regex: q, $options: "i" };

    const skip = (page - 1) * limit;
    const [total, media] = await Promise.all([
      PostMediaModel.countDocuments(filter),
      PostMediaModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      media,
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

export const adminDeleteMedia: RequestHandler = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    if (!Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({ message: "Invalid media ID" });
      return;
    }

    const media = await PostMediaModel.findById(mediaId);
    if (!media) {
      res.status(404).json({ message: "Media not found" });
      return;
    }

    if (!media.deletedAt) {
      media.deletedAt = new Date();
      await media.save();
    }

    res.json({ message: "Media deleted" });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreMedia: RequestHandler = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    if (!Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({ message: "Invalid media ID" });
      return;
    }

    const media = await PostMediaModel.findById(mediaId);
    if (!media) {
      res.status(404).json({ message: "Media not found" });
      return;
    }

    if (media.deletedAt) {
      media.deletedAt = null;
      await media.save();
    }

    res.json({ message: "Media restored" });
  } catch (error) {
    next(error);
  }
};
