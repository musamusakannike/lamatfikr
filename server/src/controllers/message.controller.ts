import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { ConversationModel } from "../models/conversation.model";
import { MessageModel } from "../models/message.model";
import { MessageReadModel } from "../models/message-read.model";
import { UserModel } from "../models/user.model";
import { BlockModel } from "../models/block.model";
import { ConversationType } from "../models/common";
import { io } from "../realtime/socket";
import {
  createConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
  toggleReactionSchema,
} from "../validators/message.validator";

// Get or create a private conversation with another user
export const getOrCreateConversation: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = createConversationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { participantId } = validation.data;

    if (userId === participantId) {
      res.status(400).json({ message: "Cannot create conversation with yourself" });
      return;
    }

    // Check if participant exists
    const participant = await UserModel.findById(participantId);
    if (!participant) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if blocked
    const isBlocked = await BlockModel.findOne({
      $or: [
        { blockerId: userId, blockedId: participantId },
        { blockerId: participantId, blockedId: userId },
      ],
    });
    if (isBlocked) {
      res.status(403).json({ message: "Cannot message this user" });
      return;
    }

    // Check for existing conversation
    let conversation = await ConversationModel.findOne({
      type: ConversationType.private,
      participants: { $all: [userId, participantId], $size: 2 },
      deletedAt: null,
    }).populate("participants", "firstName lastName username avatar verified");

    if (!conversation) {
      // Create new conversation
      conversation = await ConversationModel.create({
        type: ConversationType.private,
        participants: [userId, participantId],
      });

      conversation = await ConversationModel.findById(conversation._id)
        .populate("participants", "firstName lastName username avatar verified");
    }

    res.json({
      conversation: {
        _id: conversation!._id,
        type: conversation!.type,
        participants: conversation!.participants,
        lastMessageId: conversation!.lastMessageId,
        createdAt: (conversation as unknown as { createdAt: Date }).createdAt,
        updatedAt: (conversation as unknown as { updatedAt: Date }).updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleReaction: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId, messageId } = req.params;

    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const validation = toggleReactionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { emoji } = validation.data;

    // Check if user is participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
      deletedAt: null,
    }).lean();

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const msg = await MessageModel.findOne({
      _id: messageId,
      conversationId,
      deletedAt: null,
    }).lean();

    if (!msg) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    const hasReaction = Array.isArray((msg as unknown as { reactions?: Array<{ emoji: string; userId: Types.ObjectId }> }).reactions)
      ? (msg as unknown as { reactions: Array<{ emoji: string; userId: Types.ObjectId }> }).reactions.some(
          (r) => r.emoji === emoji && r.userId.toString() === userId
        )
      : false;

    if (hasReaction) {
      await MessageModel.updateOne(
        { _id: messageId, conversationId },
        { $pull: { reactions: { emoji, userId: new Types.ObjectId(userId) } } }
      );
    } else {
      await MessageModel.updateOne(
        { _id: messageId, conversationId },
        { $push: { reactions: { emoji, userId: new Types.ObjectId(userId) } } }
      );
    }

    const updated = await MessageModel.findById(messageId).select("reactions").lean();
    const reactions = (updated as unknown as { reactions?: unknown[] })?.reactions || [];

    io.to(`conversation:${conversationId}`).emit("message:reaction", {
      type: "conversation",
      conversationId,
      messageId,
      reactions,
    });

    res.json({
      message: "Reaction updated",
      data: { messageId, reactions },
    });
  } catch (error) {
    next(error);
  }
};

// Get all conversations for current user
export const getConversations: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const conversations = await ConversationModel.find({
      participants: userId,
      deletedAt: null,
    })
      .populate("participants", "firstName lastName username avatar verified")
      .populate({
        path: "lastMessageId",
        select: "content media senderId createdAt",
        populate: {
          path: "senderId",
          select: "firstName lastName username",
        },
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ConversationModel.countDocuments({
      participants: userId,
      deletedAt: null,
    });

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await MessageModel.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          deletedAt: null,
          _id: {
            $nin: await MessageReadModel.find({ userId }).distinct("messageId"),
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    res.json({
      conversations: conversationsWithUnread,
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

// Get a single conversation by ID
export const getConversation: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId } = req.params;

    if (!Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "Invalid conversation ID" });
      return;
    }

    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
      deletedAt: null,
    })
      .populate("participants", "firstName lastName username avatar verified")
      .populate({
        path: "lastMessageId",
        select: "content media senderId createdAt",
      })
      .lean();

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
};

// Send a message in a conversation
export const sendMessage: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId } = req.params;

    if (!Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "Invalid conversation ID" });
      return;
    }

    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { content, media, attachments, location } = validation.data;

    // Check if user is participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
      deletedAt: null,
    });

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    // Check if blocked (for private conversations)
    if (conversation.type === ConversationType.private) {
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== userId
      );
      if (otherParticipant) {
        const isBlocked = await BlockModel.findOne({
          $or: [
            { blockerId: userId, blockedId: otherParticipant },
            { blockerId: otherParticipant, blockedId: userId },
          ],
        });
        if (isBlocked) {
          res.status(403).json({ message: "Cannot send message to this user" });
          return;
        }
      }
    }

    // Create message
    const message = await MessageModel.create({
      conversationId,
      senderId: userId,
      content,
      media: media || [],
      attachments: attachments || [],
      location,
    });

    // Update conversation's lastMessageId
    await ConversationModel.updateOne(
      { _id: conversationId },
      { lastMessageId: message._id }
    );

    // Populate sender info
    const populatedMessage = await MessageModel.findById(message._id)
      .populate("senderId", "firstName lastName username avatar verified")
      .lean();

    // Emit real-time event to conversation participants (excluding sender)
    const conversationParticipants = await ConversationModel.findById(conversationId).select("participants").lean();
    if (conversationParticipants) {
      conversationParticipants.participants.forEach((participantId) => {
        if (participantId.toString() !== userId) {
          io.to(`user:${participantId}`).emit("message:new", {
            type: "conversation",
            conversationId,
            message: populatedMessage,
          });
        }
      });
    }

    res.status(201).json({
      message: "Message sent",
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// Get messages in a conversation
export const getMessages: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId } = req.params;

    if (!Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "Invalid conversation ID" });
      return;
    }

    const validation = getMessagesSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
      deletedAt: null,
    });

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const messages = await MessageModel.find({
      conversationId,
      deletedAt: null,
    })
      .populate("senderId", "firstName lastName username avatar verified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MessageModel.countDocuments({
      conversationId,
      deletedAt: null,
    });

    // Mark messages as read
    const unreadMessageIds = messages
      .filter((m) => m.senderId && (m.senderId as unknown as { _id: Types.ObjectId })._id.toString() !== userId)
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      const existingReads = await MessageReadModel.find({
        messageId: { $in: unreadMessageIds },
        userId,
      }).distinct("messageId");

      const newReads = unreadMessageIds
        .filter((id) => !existingReads.some((r) => r.toString() === id.toString()))
        .map((messageId) => ({
          messageId,
          userId,
          readAt: new Date(),
        }));

      if (newReads.length > 0) {
        await MessageReadModel.insertMany(newReads, { ordered: false }).catch(() => {
          // Ignore duplicate key errors
        });
      }
    }

    res.json({
      messages: messages.reverse(), // Return in chronological order
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

// Delete a message (soft delete)
export const deleteMessage: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId, messageId } = req.params;

    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const message = await MessageModel.findOne({
      _id: messageId,
      conversationId,
      senderId: userId,
      deletedAt: null,
    });

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    await MessageModel.updateOne(
      { _id: messageId },
      { deletedAt: new Date() }
    );

    // Emit message deleted event
    io.to(`conversation:${conversationId}`).emit("message:deleted", {
      type: "conversation",
      conversationId,
      messageId,
    });

    res.json({ message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

// Mark conversation as read
export const markConversationAsRead: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId } = req.params;

    if (!Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "Invalid conversation ID" });
      return;
    }

    // Check if user is participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
      deletedAt: null,
    });

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    // Get all unread messages in this conversation
    const unreadMessages = await MessageModel.find({
      conversationId,
      senderId: { $ne: userId },
      deletedAt: null,
    }).select("_id");

    const existingReads = await MessageReadModel.find({
      messageId: { $in: unreadMessages.map((m) => m._id) },
      userId,
    }).distinct("messageId");

    const newReads = unreadMessages
      .filter((m) => !existingReads.some((r) => r.toString() === m._id.toString()))
      .map((m) => ({
        messageId: m._id,
        userId,
        readAt: new Date(),
      }));

    if (newReads.length > 0) {
      await MessageReadModel.insertMany(newReads, { ordered: false }).catch(() => {
        // Ignore duplicate key errors
      });
    }

    res.json({ message: "Conversation marked as read" });
  } catch (error) {
    next(error);
  }
};

// Get unread message count
export const getUnreadCount: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get all conversations user is part of
    const conversations = await ConversationModel.find({
      participants: userId,
      deletedAt: null,
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    // Get all messages in these conversations not sent by user
    const allMessages = await MessageModel.find({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      deletedAt: null,
    }).select("_id");

    // Get read messages
    const readMessageIds = await MessageReadModel.find({
      userId,
      messageId: { $in: allMessages.map((m) => m._id) },
    }).distinct("messageId");

    const unreadCount = allMessages.length - readMessageIds.length;

    res.json({ unreadCount: Math.max(0, unreadCount) });
  } catch (error) {
    next(error);
  }
};
