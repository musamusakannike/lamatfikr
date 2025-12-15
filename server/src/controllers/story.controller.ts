import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { StoryModel } from "../models/story.model";
import { StoryViewModel } from "../models/story-view.model";
import { UserModel } from "../models/user.model";
import { FollowModel } from "../models/follow.model";
import { FriendshipModel } from "../models/friendship.model";
import { BlockModel } from "../models/block.model";
import { FollowStatus, FriendshipStatus } from "../models/common";
import {
  createStorySchema,
  storyPaginationSchema,
  storyFilterSchema,
} from "../validators/story.validator";

// ==================== HELPERS ====================

function getMediaType(url: string): "image" | "video" {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext)) ? "video" : "image";
}

async function getViewableUserIds(userId: string): Promise<Types.ObjectId[]> {
  // Get users the current user follows
  const following = await FollowModel.find({
    followerId: userId,
    status: FollowStatus.accepted,
  }).select("followingId");

  // Get friends
  const friendships = await FriendshipModel.find({
    $or: [
      { requesterId: userId, status: FriendshipStatus.accepted },
      { addresseeId: userId, status: FriendshipStatus.accepted },
    ],
  });

  const friendIds = friendships.map((f) =>
    f.requesterId.toString() === userId ? f.addresseeId : f.requesterId
  );

  // Get blocked users (both directions)
  const blocks = await BlockModel.find({
    $or: [{ blockerId: userId }, { blockedId: userId }],
  });

  const blockedIds = new Set(
    blocks.flatMap((b) => [b.blockerId.toString(), b.blockedId.toString()])
  );
  blockedIds.delete(userId);

  // Combine following and friends, remove blocked
  const viewableIds = new Set<string>();
  viewableIds.add(userId); // Include own stories

  following.forEach((f) => {
    const id = f.followingId.toString();
    if (!blockedIds.has(id)) viewableIds.add(id);
  });

  friendIds.forEach((id) => {
    const idStr = id.toString();
    if (!blockedIds.has(idStr)) viewableIds.add(idStr);
  });

  return Array.from(viewableIds).map((id) => new Types.ObjectId(id));
}

// ==================== CONTROLLERS ====================

export const createStory: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId!;
    const parsed = createStorySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      return;
    }

    const { media, expiresInHours } = parsed.data;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const story = await StoryModel.create({
      userId,
      media,
      expiresAt,
    });

    const populatedStory = await StoryModel.findById(story._id).populate(
      "userId",
      "firstName lastName username avatar verified"
    );

    res.status(201).json({
      message: "Story created successfully",
      story: populatedStory,
    });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ message: "Failed to create story" });
  }
};

export const getStories: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId!;
    const paginationParsed = storyPaginationSchema.safeParse(req.query);
    const filterParsed = storyFilterSchema.safeParse(req.query);

    if (!paginationParsed.success) {
      res.status(400).json({ message: "Invalid pagination", errors: paginationParsed.error.flatten() });
      return;
    }

    const { page, limit } = paginationParsed.data;
    const { mediaType } = filterParsed.success ? filterParsed.data : { mediaType: "all" as const };

    const viewableUserIds = await getViewableUserIds(userId);

    const now = new Date();
    const baseQuery: Record<string, unknown> = {
      userId: { $in: viewableUserIds },
      expiresAt: { $gt: now },
      deletedAt: null,
    };

    // Get all stories first, then filter by media type in memory
    const allStories = await StoryModel.find(baseQuery)
      .populate("userId", "firstName lastName username avatar verified")
      .sort({ createdAt: -1 })
      .lean();

    // Filter by media type if needed
    let filteredStories = allStories;
    if (mediaType !== "all") {
      filteredStories = allStories.filter((story) => {
        const storyMediaTypes = story.media.map(getMediaType);
        if (mediaType === "images") {
          return storyMediaTypes.some((t) => t === "image");
        }
        if (mediaType === "videos") {
          return storyMediaTypes.some((t) => t === "video");
        }
        return true;
      });
    }

    // Get viewed story IDs for current user
    const storyIds = filteredStories.map((s) => s._id);
    const viewedStories = await StoryViewModel.find({
      storyId: { $in: storyIds },
      viewerId: userId,
    }).select("storyId");

    const viewedStoryIds = new Set(viewedStories.map((v) => v.storyId.toString()));

    // Add hasUnviewed flag and media type info
    const storiesWithViewStatus = filteredStories.map((story) => ({
      ...story,
      hasUnviewed: !viewedStoryIds.has(story._id.toString()),
      mediaItems: story.media.map((url) => ({
        url,
        type: getMediaType(url),
      })),
    }));

    // Paginate
    const total = storiesWithViewStatus.length;
    const skip = (page - 1) * limit;
    const paginatedStories = storiesWithViewStatus.slice(skip, skip + limit);

    res.json({
      stories: paginatedStories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};

export const getStory: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { storyId } = req.params;

    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: "Invalid story ID" });
      return;
    }

    const story = await StoryModel.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
      deletedAt: null,
    }).populate("userId", "firstName lastName username avatar verified");

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    // Check if user can view this story
    if (userId) {
      const viewableUserIds = await getViewableUserIds(userId);
      const canView = viewableUserIds.some(
        (id) => id.toString() === story.userId._id.toString()
      );

      if (!canView) {
        res.status(403).json({ message: "You cannot view this story" });
        return;
      }
    }

    // Check if viewed
    let hasUnviewed = true;
    if (userId) {
      const viewed = await StoryViewModel.findOne({
        storyId: story._id,
        viewerId: userId,
      });
      hasUnviewed = !viewed;
    }

    res.json({
      story: {
        ...story.toObject(),
        hasUnviewed,
        mediaItems: story.media.map((url) => ({
          url,
          type: getMediaType(url),
        })),
      },
    });
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({ message: "Failed to fetch story" });
  }
};

export const deleteStory: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId!;
    const { storyId } = req.params;

    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: "Invalid story ID" });
      return;
    }

    const story = await StoryModel.findOne({
      _id: storyId,
      userId,
      deletedAt: null,
    });

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    // Soft delete
    story.deletedAt = new Date();
    await story.save();

    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ message: "Failed to delete story" });
  }
};

export const viewStory: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId!;
    const { storyId } = req.params;

    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: "Invalid story ID" });
      return;
    }

    const story = await StoryModel.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
      deletedAt: null,
    });

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    // Check if user can view this story
    const viewableUserIds = await getViewableUserIds(userId);
    const canView = viewableUserIds.some(
      (id) => id.toString() === story.userId.toString()
    );

    if (!canView) {
      res.status(403).json({ message: "You cannot view this story" });
      return;
    }

    // Record view (upsert to avoid duplicates)
    await StoryViewModel.findOneAndUpdate(
      { storyId: story._id, viewerId: userId },
      { viewedAt: new Date() },
      { upsert: true }
    );

    // Increment view count if this is a new view
    const existingView = await StoryViewModel.findOne({
      storyId: story._id,
      viewerId: userId,
    });

    if (!existingView) {
      await StoryModel.findByIdAndUpdate(storyId, { $inc: { viewCount: 1 } });
    }

    res.json({ message: "Story viewed" });
  } catch (error) {
    console.error("View story error:", error);
    res.status(500).json({ message: "Failed to record story view" });
  }
};

export const getStoryViewers: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId!;
    const { storyId } = req.params;
    const paginationParsed = storyPaginationSchema.safeParse(req.query);

    if (!paginationParsed.success) {
      res.status(400).json({ message: "Invalid pagination", errors: paginationParsed.error.flatten() });
      return;
    }

    const { page, limit } = paginationParsed.data;

    if (!Types.ObjectId.isValid(storyId)) {
      res.status(400).json({ message: "Invalid story ID" });
      return;
    }

    // Only story owner can see viewers
    const story = await StoryModel.findOne({
      _id: storyId,
      userId,
      deletedAt: null,
    });

    if (!story) {
      res.status(404).json({ message: "Story not found or you don't have permission" });
      return;
    }

    const skip = (page - 1) * limit;

    const [viewers, total] = await Promise.all([
      StoryViewModel.find({ storyId })
        .populate("viewerId", "firstName lastName username avatar verified")
        .sort({ viewedAt: -1 })
        .skip(skip)
        .limit(limit),
      StoryViewModel.countDocuments({ storyId }),
    ]);

    res.json({
      viewers: viewers.map((v) => ({
        user: v.viewerId,
        viewedAt: v.viewedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get story viewers error:", error);
    res.status(500).json({ message: "Failed to fetch story viewers" });
  }
};

export const getUserStories: RequestHandler = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    // Check if current user can view this user's stories
    if (currentUserId && currentUserId !== userId) {
      const viewableUserIds = await getViewableUserIds(currentUserId);
      const canView = viewableUserIds.some((id) => id.toString() === userId);

      if (!canView) {
        res.status(403).json({ message: "You cannot view this user's stories" });
        return;
      }
    }

    const stories = await StoryModel.find({
      userId,
      expiresAt: { $gt: new Date() },
      deletedAt: null,
    })
      .populate("userId", "firstName lastName username avatar verified")
      .sort({ createdAt: -1 });

    // Get viewed status if logged in
    let viewedStoryIds = new Set<string>();
    if (currentUserId) {
      const storyIds = stories.map((s) => s._id);
      const viewedStories = await StoryViewModel.find({
        storyId: { $in: storyIds },
        viewerId: currentUserId,
      }).select("storyId");
      viewedStoryIds = new Set(viewedStories.map((v) => v.storyId.toString()));
    }

    const storiesWithStatus = stories.map((story) => ({
      ...story.toObject(),
      hasUnviewed: !viewedStoryIds.has(story._id.toString()),
      mediaItems: story.media.map((url) => ({
        url,
        type: getMediaType(url),
      })),
    }));

    res.json({ stories: storiesWithStatus });
  } catch (error) {
    console.error("Get user stories error:", error);
    res.status(500).json({ message: "Failed to fetch user stories" });
  }
};

export const getMyStories: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId!;

    const stories = await StoryModel.find({
      userId,
      expiresAt: { $gt: new Date() },
      deletedAt: null,
    })
      .populate("userId", "firstName lastName username avatar verified")
      .sort({ createdAt: -1 });

    const storiesWithDetails = stories.map((story) => ({
      ...story.toObject(),
      hasUnviewed: false, // Own stories are always "viewed"
      mediaItems: story.media.map((url) => ({
        url,
        type: getMediaType(url),
      })),
    }));

    res.json({ stories: storiesWithDetails });
  } catch (error) {
    console.error("Get my stories error:", error);
    res.status(500).json({ message: "Failed to fetch your stories" });
  }
};
