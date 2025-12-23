import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

import {
  CommunityModel,
  CommunityMemberModel,
  CommunityMemberRole,
  CommunityMessageModel,
} from "../models";
import { editMessageSchema } from "../validators/message.validator";
import { io } from "../realtime/socket";

// Helper to get authenticated user ID
function getUserId(req: Request): Types.ObjectId {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return new Types.ObjectId(userId);
}

// Create a new community
export async function createCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { name, description, image, coverImage, category } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({ message: "Name, description, and category are required" });
      return;
    }

    const community = await CommunityModel.create({
      name,
      description,
      image,
      coverImage,
      category,
      ownerId: userId,
      memberCount: 1,
    });

    // Add creator as owner member
    await CommunityMemberModel.create({
      communityId: community._id,
      userId,
      role: CommunityMemberRole.owner,
    });

    res.status(201).json({
      message: "Community created successfully",
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        coverImage: community.coverImage,
        category: community.category,
        memberCount: community.memberCount,
        createdAt: (community as unknown as { createdAt: Date }).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get all communities (with search and filters)
export async function getCommunities(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { search, category, filter, page = 1, limit = 20 } = req.query;

    const query: Record<string, unknown> = { deletedAt: null };

    // Text search
    if (search && typeof search === "string") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category && typeof category === "string") {
      query.category = category;
    }

    // Get user's community memberships with lastReadAt
    const userMemberships = await CommunityMemberModel.find({
      userId,
      deletedAt: null,
    }).select("communityId role lastReadAt");

    const userCommunityIds = userMemberships.map((m) => m.communityId.toString());
    const userRoleMap = new Map(userMemberships.map((m) => [m.communityId.toString(), m.role]));
    const userLastReadMap = new Map(userMemberships.map((m) => [m.communityId.toString(), m.lastReadAt]));

    // Filter by ownership if requested
    if (filter === "owned") {
      query.ownerId = userId;
    } else if (filter === "joined") {
      query._id = { $in: userMemberships.map((m) => m.communityId) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [communities, total] = await Promise.all([
      CommunityModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("ownerId", "username displayName avatar")
        .lean(),
      CommunityModel.countDocuments(query),
    ]);

    // Get last messages for each community
    const communityIds = communities.map((c) => c._id);
    const lastMessages = await CommunityMessageModel.aggregate([
      { $match: { communityId: { $in: communityIds }, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$communityId", lastMessage: { $first: "$$ROOT" } } },
    ]);

    const lastMessageMap = new Map(lastMessages.map((m) => [m._id.toString(), m.lastMessage]));

    // Get unread counts for each community based on lastReadAt
    const memberCommunityIds = userMemberships.map((m) => m.communityId);
    const unreadCountPromises = memberCommunityIds.map(async (communityId) => {
      const lastReadAt = userLastReadMap.get(communityId.toString());
      const matchQuery: Record<string, unknown> = {
        communityId,
        deletedAt: null,
        senderId: { $ne: userId },
      };

      if (lastReadAt) {
        matchQuery.createdAt = { $gt: lastReadAt };
      }

      const count = await CommunityMessageModel.countDocuments(matchQuery);
      return { communityId: communityId.toString(), count };
    });

    const unreadResults = await Promise.all(unreadCountPromises);
    const unreadMap = new Map(unreadResults.map((u) => [u.communityId, u.count]));

    const communitiesWithDetails = communities.map((community) => {
      const communityIdStr = community._id.toString();
      const lastMsg = lastMessageMap.get(communityIdStr);
      const isMember = userCommunityIds.includes(communityIdStr);
      const role = userRoleMap.get(communityIdStr) || null;

      return {
        id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        coverImage: community.coverImage,
        category: community.category,
        memberCount: community.memberCount,
        owner: community.ownerId,
        isMember,
        role,
        lastMessage: lastMsg
          ? {
            content: lastMsg.content,
            createdAt: lastMsg.createdAt,
          }
          : null,
        unreadCount: isMember ? (unreadMap.get(communityIdStr) || 0) : 0,
        createdAt: (community as unknown as { createdAt: Date }).createdAt,
      };
    });

    res.json({
      communities: communitiesWithDetails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get single community details
export async function getCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const community = await CommunityModel.findOne({ _id: communityId, deletedAt: null })
      .populate("ownerId", "username displayName avatar")
      .lean();

    if (!community) {
      res.status(404).json({ message: "Community not found" });
      return;
    }

    // Check membership
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    res.json({
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        coverImage: community.coverImage,
        category: community.category,
        memberCount: community.memberCount,
        owner: community.ownerId,
        isMember: !!membership,
        role: membership?.role || null,
        createdAt: (community as unknown as { createdAt: Date }).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update community (owner/admin only)
export async function updateCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;
    const { name, description, image, coverImage, category } = req.body;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const community = await CommunityModel.findOne({ _id: communityId, deletedAt: null });

    if (!community) {
      res.status(404).json({ message: "Community not found" });
      return;
    }

    // Check if user is owner or admin
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership || (membership.role !== CommunityMemberRole.owner && membership.role !== CommunityMemberRole.admin)) {
      res.status(403).json({ message: "Only community owner or admin can update the community" });
      return;
    }

    // Update fields
    if (name) community.name = name;
    if (description) community.description = description;
    if (image !== undefined) community.image = image;
    if (coverImage !== undefined) community.coverImage = coverImage;
    if (category) community.category = category;

    await community.save();

    res.json({
      message: "Community updated successfully",
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        coverImage: community.coverImage,
        category: community.category,
        memberCount: community.memberCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Delete community (owner only)
export async function deleteCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const community = await CommunityModel.findOne({ _id: communityId, deletedAt: null });

    if (!community) {
      res.status(404).json({ message: "Community not found" });
      return;
    }

    // Check if user is owner
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership || membership.role !== CommunityMemberRole.owner) {
      res.status(403).json({ message: "Only community owner can delete the community" });
      return;
    }

    // Soft delete
    community.deletedAt = new Date();
    await community.save();

    // Soft delete all memberships
    await CommunityMemberModel.updateMany(
      { communityId, deletedAt: null },
      { deletedAt: new Date() }
    );

    res.json({ message: "Community deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// Join community
export async function joinCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const community = await CommunityModel.findOne({ _id: communityId, deletedAt: null });

    if (!community) {
      res.status(404).json({ message: "Community not found" });
      return;
    }

    // Check if already a member
    const existingMembership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (existingMembership) {
      res.status(400).json({ message: "You are already a member of this community" });
      return;
    }

    // Create membership
    const membership = await CommunityMemberModel.create({
      communityId,
      userId,
      role: CommunityMemberRole.member,
    });

    // Increment member count
    await CommunityModel.updateOne({ _id: communityId }, { $inc: { memberCount: 1 } });

    res.status(201).json({
      message: "Successfully joined the community",
      membership: {
        communityId: membership.communityId,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Leave community
export async function leaveCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(400).json({ message: "You are not a member of this community" });
      return;
    }

    if (membership.role === CommunityMemberRole.owner) {
      res.status(400).json({ message: "Owner cannot leave the community. Transfer ownership or delete the community." });
      return;
    }

    // Soft delete membership
    membership.deletedAt = new Date();
    await membership.save();

    // Decrement member count
    await CommunityModel.updateOne({ _id: communityId }, { $inc: { memberCount: -1 } });

    res.json({ message: "Successfully left the community" });
  } catch (error) {
    next(error);
  }
}

// Get community members
export async function getCommunityMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    // Check if user is a member
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to view members" });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [members, total] = await Promise.all([
      CommunityMemberModel.find({ communityId, deletedAt: null })
        .sort({ role: 1, createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "username displayName avatar")
        .lean(),
      CommunityMemberModel.countDocuments({ communityId, deletedAt: null }),
    ]);

    res.json({
      members: members.map((m) => ({
        user: m.userId,
        role: m.role,
        joinedAt: (m as unknown as { createdAt: Date }).createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Send message to community
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;
    const { content, media, attachments, location } = req.body;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    if (!content && (!media || media.length === 0) && (!attachments || attachments.length === 0) && !location) {
      res.status(400).json({ message: "Message content or media is required" });
      return;
    }

    // Check if user is a member
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to send messages" });
      return;
    }

    const message = await CommunityMessageModel.create({
      communityId,
      senderId: userId,
      content,
      media: media || [],
      attachments: attachments || [],
      location,
      isViewOnce: req.body.isViewOnce || false,
    });

    const populatedMessage = await CommunityMessageModel.findById(message._id)
      .populate("senderId", "username displayName avatar")
      .lean();

    // Emit real-time event to community members
    const messageToEmit = {
      id: populatedMessage?._id,
      communityId: populatedMessage?.communityId,
      sender: populatedMessage?.senderId,
      isViewOnce: (populatedMessage as unknown as { isViewOnce?: boolean })?.isViewOnce,
      content: populatedMessage?.content,
      media: populatedMessage?.media,
      attachments: (populatedMessage as unknown as { attachments?: unknown[] })?.attachments,
      location: (populatedMessage as unknown as { location?: unknown })?.location,
      reactions: (populatedMessage as unknown as { reactions?: unknown[] })?.reactions,
      createdAt: (populatedMessage as unknown as { createdAt: Date })?.createdAt,
    };

    // For view-once messages, hide content from receivers (not sender) until they click to view
    if ((populatedMessage as unknown as { isViewOnce?: boolean })?.isViewOnce) {
      const members = await CommunityMemberModel.find({
        communityId,
        deletedAt: null,
      }).select("userId").lean();

      members.forEach((member) => {
        if (member.userId.toString() === userId.toString()) {
          // Send full message to sender
          io.to(`user:${member.userId}`).emit("message:new", {
            type: "community",
            communityId,
            message: messageToEmit,
          });
        } else {
          // Send filtered message to other members
          io.to(`user:${member.userId}`).emit("message:new", {
            type: "community",
            communityId,
            message: {
              ...messageToEmit,
              content: undefined,
              media: [],
              attachments: [],
            },
          });
        }
      });
    } else {
      // Regular message - broadcast to all community members
      io.to(`community:${communityId}`).emit("message:new", {
        type: "community",
        communityId,
        message: messageToEmit,
      });
    }

    res.status(201).json({
      message: "Message sent",
      data: {
        id: populatedMessage?._id,
        communityId: populatedMessage?.communityId,
        sender: populatedMessage?.senderId,
        content: populatedMessage?.content,
        media: populatedMessage?.media,
        attachments: (populatedMessage as unknown as { attachments?: unknown[] })?.attachments,
        location: (populatedMessage as unknown as { location?: unknown })?.location,
        reactions: (populatedMessage as unknown as { reactions?: unknown[] })?.reactions,
        createdAt: (populatedMessage as unknown as { createdAt: Date })?.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId, messageId } = req.params;
    const { emoji } = req.body as { emoji?: string };

    const userObjectId = new Types.ObjectId(String(userId));
    const userIdStr = userObjectId.toString();

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid community or message ID" });
      return;
    }

    if (!emoji || typeof emoji !== "string") {
      res.status(400).json({ message: "Emoji is required" });
      return;
    }

    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    }).lean();

    if (!membership) {
      res.status(403).json({ message: "You must be a member to react to messages" });
      return;
    }

    const msg = await CommunityMessageModel.findOne({ _id: messageId, communityId, deletedAt: null }).lean();
    if (!msg) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    const hasReaction = Array.isArray((msg as unknown as { reactions?: Array<{ emoji: string; userId: Types.ObjectId }> }).reactions)
      ? (msg as unknown as { reactions: Array<{ emoji: string; userId: Types.ObjectId }> }).reactions.some(
        (r) => r.emoji === emoji && r.userId.toString() === userIdStr
      )
      : false;

    if (hasReaction) {
      await CommunityMessageModel.updateOne(
        { _id: messageId, communityId },
        { $pull: { reactions: { emoji, userId: userObjectId } } }
      );
    } else {
      await CommunityMessageModel.updateOne(
        { _id: messageId, communityId },
        { $push: { reactions: { emoji, userId: userObjectId } } }
      );
    }

    const updated = await CommunityMessageModel.findById(messageId).select("reactions").lean();
    const reactions = (updated as unknown as { reactions?: unknown[] })?.reactions || [];

    io.to(`community:${communityId}`).emit("message:reaction", {
      type: "community",
      communityId,
      messageId,
      reactions,
    });

    res.json({ message: "Reaction updated", data: { messageId, reactions } });
  } catch (error) {
    next(error);
  }
}

// Delete community message
export async function deleteMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId, messageId } = req.params;

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid community or message ID" });
      return;
    }

    const message = await CommunityMessageModel.findOne({
      _id: messageId,
      communityId,
      deletedAt: null,
    });

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    // Check permissions
    // Sender can always delete their own message
    if (message.senderId.toString() === userId.toString()) {
      // Proceed
    } else {
      // Check if user is owner or admin of the community
      const membership = await CommunityMemberModel.findOne({
        communityId,
        userId,
        deletedAt: null,
      });

      if (!membership || (membership.role !== CommunityMemberRole.owner && membership.role !== CommunityMemberRole.admin)) {
        res.status(403).json({ message: "You don't have permission to delete this message" });
        return;
      }
    }

    // Soft delete
    message.deletedAt = new Date();
    await message.save();

    // Emit event
    io.to(`community:${communityId}`).emit("message:deleted", {
      type: "community",
      communityId,
      messageId,
    });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// Edit community message
export async function editMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId, messageId } = req.params;

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid community or message ID" });
      return;
    }

    const validation = editMessageSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { content } = validation.data;

    const message = await CommunityMessageModel.findOne({
      _id: messageId,
      communityId,
      senderId: userId,
      deletedAt: null,
    });

    if (!message) {
      // Either message doesn't exist or user is not the sender
      res.status(404).json({ message: "Message not found or you are not the sender" });
      return;
    }

    // Check if message is older than 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    const messageTime = (message as unknown as { createdAt: Date }).createdAt.getTime();
    if (Date.now() - messageTime > ONE_HOUR) {
      res.status(400).json({ message: "You can only edit messages within 1 hour of sending" });
      return;
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    // Emit event
    const payload = {
      type: "community",
      communityId,
      messageId,
      content,
      editedAt: message.editedAt,
    };

    io.to(`community:${communityId}`).emit("message:updated", payload);

    res.json({
      message: "Message updated successfully",
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

// Get community messages
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;
    const { limit = 50, before } = req.query;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    // Check if user is a member
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to view messages" });
      return;
    }

    const query: Record<string, unknown> = { communityId, deletedAt: null };

    // For pagination by timestamp
    if (before && typeof before === "string") {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await CommunityMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("senderId", "username displayName avatar")
      .lean();

    res.json({
      messages: messages.reverse().map((m) => {
        if (m.isViewOnce) {
          const hasViewed = (m.viewedBy as unknown as Types.ObjectId[])?.some(id => id.toString() === userId.toString());
          if ((m.senderId as any)._id.toString() === userId.toString()) {
            return { ...m, content: undefined, media: [], attachments: [], isViewOnce: true };
          }
          if (hasViewed) {
            return { ...m, content: undefined, media: [], attachments: [], isViewOnce: true, isExpired: true };
          }
          // Receiver who hasn't viewed it yet - hide content until they click to view
          return { ...m, content: undefined, media: [], attachments: [], isViewOnce: true };
        }
        return {
          id: m._id,
          communityId: m.communityId,
          sender: m.senderId,
          isViewOnce: m.isViewOnce,
          content: m.content,
          media: m.media,
          attachments: (m as unknown as { attachments?: unknown[] })?.attachments,
          location: (m as unknown as { location?: unknown })?.location,
          reactions: (m as unknown as { reactions?: unknown[] })?.reactions,
          createdAt: (m as unknown as { createdAt: Date }).createdAt,
        };
      }),
      hasMore: messages.length === Number(limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsViewed(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId, messageId } = req.params;

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    // Check membership
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member" });
      return;
    }

    const message = await CommunityMessageModel.findOne({
      _id: messageId,
      communityId,
      deletedAt: null,
    });

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    if (!message.isViewOnce) {
      res.status(400).json({ message: "Not a view once message" });
      return;
    }

    // Check if user has already viewed this message
    const viewedBy = (message.viewedBy as unknown as Types.ObjectId[]) || [];
    const alreadyViewed = viewedBy.some(id => id.toString() === userId.toString());
    
    if (alreadyViewed) {
      res.status(403).json({ message: "Message has already been viewed" });
      return;
    }

    // Add user to viewedBy array
    await CommunityMessageModel.updateOne(
      { _id: messageId },
      { $push: { viewedBy: userId } }
    );

    res.json({
      message: "Marked as viewed",
      data: {
        content: message.content,
        media: message.media,
        attachments: message.attachments,
        location: message.location,
      }
    });
  } catch (error) {
    next(error);
  }
}


// Mark community messages as read
export async function markCommunityAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    // Check if user is a member
    const membership = await CommunityMemberModel.findOne({
      communityId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to mark messages as read" });
      return;
    }

    // Update lastReadAt to current time
    await CommunityMemberModel.updateOne(
      { _id: membership._id },
      { lastReadAt: new Date() }
    );

    res.json({ message: "Community marked as read" });
  } catch (error) {
    next(error);
  }
}

// Get total unread community messages count for sidebar
export async function getTotalUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);

    // Get user's community memberships with lastReadAt
    const userMemberships = await CommunityMemberModel.find({
      userId,
      deletedAt: null,
    }).select("communityId lastReadAt");

    if (userMemberships.length === 0) {
      res.json({ totalUnreadCount: 0 });
      return;
    }

    // Calculate unread count for each community based on lastReadAt
    const unreadCountPromises = userMemberships.map(async (membership) => {
      const matchQuery: Record<string, unknown> = {
        communityId: membership.communityId,
        deletedAt: null,
        senderId: { $ne: userId },
      };

      if (membership.lastReadAt) {
        matchQuery.createdAt = { $gt: membership.lastReadAt };
      }

      return CommunityMessageModel.countDocuments(matchQuery);
    });

    const unreadCounts = await Promise.all(unreadCountPromises);
    const totalUnreadCount = unreadCounts.reduce((sum, count) => sum + count, 0);

    res.json({ totalUnreadCount });
  } catch (error) {
    next(error);
  }
}
