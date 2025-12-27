import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { StreamClient } from "@stream-io/node-sdk";

import { ConversationModel } from "../models/conversation.model";
import {
  ConversationEventModel,
  ConversationEventType,
  ConversationEventStatus,
} from "../models/conversation-event.model";
import { MessageModel } from "../models/message.model";
import { MessageReadModel } from "../models/message-read.model";
import { UserModel } from "../models/user.model";
import { BlockModel } from "../models/block.model";
import { ConversationType } from "../models/common";
import { io } from "../realtime/socket";

// Initialize Stream Video client for video calls
const videoClient = new StreamClient(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
);
import {
  createConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
  toggleReactionSchema,
  updateConversationSettingsSchema,
  editMessageSchema,
} from "../validators/message.validator";

// Get or create a private conversation with another user
export const getOrCreateConversation: RequestHandler = async (
  req,
  res,
  next
) => {
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
      res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
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

      conversation = await ConversationModel.findById(
        conversation._id
      ).populate("participants", "firstName lastName username avatar verified");
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

    if (
      !Types.ObjectId.isValid(conversationId) ||
      !Types.ObjectId.isValid(messageId)
    ) {
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

    const hasReaction = Array.isArray(
      (
        msg as unknown as {
          reactions?: Array<{ emoji: string; userId: Types.ObjectId }>;
        }
      ).reactions
    )
      ? (
          msg as unknown as {
            reactions: Array<{ emoji: string; userId: Types.ObjectId }>;
          }
        ).reactions.some(
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

    const updated = await MessageModel.findById(messageId)
      .select("reactions")
      .lean();
    const reactions =
      (updated as unknown as { reactions?: unknown[] })?.reactions || [];

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

    // Calculate expiration if disappearing messages are enabled
    let expiresAt: Date | null = null;
    if (conversation.disappearingMessagesDuration) {
      expiresAt = new Date(
        Date.now() + conversation.disappearingMessagesDuration
      );
    }

    // Create message
    const message = await MessageModel.create({
      conversationId,
      senderId: userId,
      content,
      media: media || [],
      attachments: attachments || [],
      location,
      expiresAt,
      isViewOnce: validation.data.isViewOnce,
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
    const conversationParticipants = await ConversationModel.findById(
      conversationId
    )
      .select("participants")
      .lean();
    if (conversationParticipants) {
      conversationParticipants.participants.forEach((participantId) => {
        if (participantId.toString() !== userId) {
          // For view-once messages, hide content from receivers until they click to view
          let messageToEmit = populatedMessage;
          if (populatedMessage && (populatedMessage as any).isViewOnce) {
            messageToEmit = {
              ...populatedMessage,
              content: undefined,
              media: [],
              attachments: [],
            };
          }
          io.to(`user:${participantId}`).emit("message:new", {
            type: "conversation",
            conversationId,
            message: messageToEmit,
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
      .filter(
        (m) =>
          m.senderId &&
          (m.senderId as unknown as { _id: Types.ObjectId })._id.toString() !==
            userId
      )
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      const existingReads = await MessageReadModel.find({
        messageId: { $in: unreadMessageIds },
        userId,
      }).distinct("messageId");

      const newReads = unreadMessageIds
        .filter(
          (id) => !existingReads.some((r) => r.toString() === id.toString())
        )
        .map((messageId) => ({
          messageId,
          userId,
          readAt: new Date(),
        }));

      if (newReads.length > 0) {
        await MessageReadModel.insertMany(newReads, { ordered: false }).catch(
          () => {
            // Ignore duplicate key errors
          }
        );
      }
    }

    res.json({
      messages: messages.reverse().map((msg) => {
        if (msg.isViewOnce) {
          const hasViewed = (msg.viewedBy as unknown as Types.ObjectId[])?.some(
            (id) => id.toString() === userId
          );
          // Sender cannot view their own view once message
          if (
            (
              msg.senderId as unknown as { _id: Types.ObjectId }
            )._id.toString() === userId
          ) {
            return { ...msg, content: undefined, media: [], attachments: [] };
          }
          // Receiver who has already viewed it
          if (hasViewed) {
            return {
              ...msg,
              content: undefined,
              media: [],
              attachments: [],
              isExpired: true,
            };
          }
          // Receiver who hasn't viewed it yet - hide content until they click to view
          return { ...msg, content: undefined, media: [], attachments: [] };
        }
        return msg;
      }),
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

// Edit a message
export const editMessage: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId, messageId } = req.params;

    if (
      !Types.ObjectId.isValid(conversationId) ||
      !Types.ObjectId.isValid(messageId)
    ) {
      res.status(400).json({ message: "Invalid ID" });
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

    // Check if message is older than 1 hour
    // Using createdAt. getTime() returns ms.
    const ONE_HOUR = 60 * 60 * 1000;
    const messageTime = (
      message as unknown as { createdAt: Date }
    ).createdAt.getTime();
    if (Date.now() - messageTime > ONE_HOUR) {
      res.status(400).json({
        message: "You can only edit messages within 1 hour of sending",
      });
      return;
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    // Emit message updated event
    const payload = {
      type: "conversation",
      conversationId,
      messageId,
      content,
      editedAt: message.editedAt,
    };

    io.to(`conversation:${conversationId}`).emit("message:updated", payload);

    res.json({
      message: "Message updated",
      data: payload,
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

    if (
      !Types.ObjectId.isValid(conversationId) ||
      !Types.ObjectId.isValid(messageId)
    ) {
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

    await MessageModel.updateOne({ _id: messageId }, { deletedAt: new Date() });

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
export const markConversationAsRead: RequestHandler = async (
  req,
  res,
  next
) => {
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
      .filter(
        (m) => !existingReads.some((r) => r.toString() === m._id.toString())
      )
      .map((m) => ({
        messageId: m._id,
        userId,
        readAt: new Date(),
      }));

    if (newReads.length > 0) {
      await MessageReadModel.insertMany(newReads, { ordered: false }).catch(
        () => {
          // Ignore duplicate key errors
        }
      );
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

// Update conversation settings (e.g., disappearing messages)
export const updateConversationSettings: RequestHandler = async (
  req,
  res,
  next
) => {
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

    const validation = updateConversationSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { disappearingMessagesDuration } = validation.data;

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

    // Update conversation
    conversation.disappearingMessagesDuration = disappearingMessagesDuration;
    await conversation.save();

    // Emit socket event to update participants
    io.to(`conversation:${conversationId}`).emit("conversation:updated", {
      conversationId,
      updates: { disappearingMessagesDuration },
    });

    res.json({
      message: "Settings updated",
      data: { disappearingMessagesDuration },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsViewed: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId, messageId } = req.params;

    if (
      !Types.ObjectId.isValid(conversationId) ||
      !Types.ObjectId.isValid(messageId)
    ) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const message = await MessageModel.findOne({
      _id: messageId,
      conversationId,
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
    const alreadyViewed = viewedBy.some((id) => id.toString() === userId);

    if (alreadyViewed) {
      res.status(403).json({ message: "Message has already been viewed" });
      return;
    }

    // Add user to viewedBy array
    await MessageModel.updateOne(
      { _id: messageId },
      { $push: { viewedBy: userId } }
    );

    // Return the content only this one time
    res.json({
      message: "Message marked as viewed",
      data: {
        content: message.content,
        media: message.media,
        attachments: message.attachments,
        location: message.location,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Start a conversation event (video call or audio call)
export const startConversationEvent: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId } = req.params;
    const { type } = req.body;

    if (!Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "Invalid conversation ID" });
      return;
    }

    if (!Object.values(ConversationEventType).includes(type)) {
      res.status(400).json({ message: "Invalid event type" });
      return;
    }

    // Check if conversation exists and user is a participant
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
      deletedAt: null,
    });

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    // Check if there's already an active event of this type
    const existingEvent = await ConversationEventModel.findOne({
      conversationId,
      type,
      status: ConversationEventStatus.active,
    });

    if (existingEvent) {
      res
        .status(400)
        .json({ message: `A ${type} is already active in this conversation` });
      return;
    }

    // Determine GetStream call type
    // Use "audio_room" for audio calls to support spaces/rooms behavior
    // Use "default" for video calls
    const callType = type === "audio_call" ? "audio_room" : "default";

    // Create GetStream call
    const callId = `conversation-${conversationId}-${type}-${Date.now()}`;
    const call = videoClient.video.call(callType, callId);

    // Get other participant
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== userId
    );

    await call.getOrCreate({
      data: {
        created_by_id: userId.toString(),
        members: [
          { user_id: userId.toString() },
          ...(otherParticipant
            ? [{ user_id: otherParticipant.toString() }]
            : []),
        ],
        custom: {
          conversationId: conversationId.toString(),
          eventType: type,
        },
      },
    });

    // Create conversation event
    const event = await ConversationEventModel.create({
      conversationId,
      type,
      status: ConversationEventStatus.active,
      startedBy: userId,
      streamCallId: callId,
    });

    // Emit socket event to conversation participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId) {
        io.to(`user:${participantId}`).emit("conversation:event:started", {
          conversationId,
          eventId: event._id.toString(),
          type,
          startedBy: userId.toString(),
          streamCallId: callId,
        });
      }
    });

    res.status(201).json({
      message: `${type} started successfully`,
      event: {
        id: event._id,
        type: event.type,
        status: event.status,
        streamCallId: event.streamCallId,
        startedBy: event.startedBy,
        createdAt: (event as unknown as { createdAt: Date }).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get active events for a conversation
export const getConversationEvents: RequestHandler = async (req, res, next) => {
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

    const events = await ConversationEventModel.find({
      conversationId,
      status: ConversationEventStatus.active,
    })
      .populate("startedBy", "username firstName lastName avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      events: events.map((event) => ({
        id: event._id,
        type: event.type,
        status: event.status,
        streamCallId: event.streamCallId,
        startedBy: event.startedBy,
        createdAt: (event as unknown as { createdAt: Date }).createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// End a conversation event
export const endConversationEvent: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { conversationId, eventId } = req.params;

    if (
      !Types.ObjectId.isValid(conversationId) ||
      !Types.ObjectId.isValid(eventId)
    ) {
      res.status(400).json({ message: "Invalid conversation ID or event ID" });
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

    const event = await ConversationEventModel.findOne({
      _id: eventId,
      conversationId,
      status: ConversationEventStatus.active,
    });

    if (!event) {
      res.status(404).json({ message: "Event not found or already ended" });
      return;
    }

    // Check if user is the one who started it or is a participant
    const canEnd =
      event.startedBy.toString() === userId.toString() ||
      conversation.participants.some((p) => p.toString() === userId);

    if (!canEnd) {
      res
        .status(403)
        .json({ message: "You don't have permission to end this event" });
      return;
    }

    // End the GetStream call if it exists
    if (event.streamCallId) {
      try {
        // Determine call type based on event type
        const callType = event.type === "audio_call" ? "audio_room" : "default";
        const call = videoClient.video.call(callType, event.streamCallId);
        await call.end();
      } catch (err) {
        // Ignore errors if call doesn't exist
        console.error("Error ending Stream call:", err);
      }
    }

    event.status = ConversationEventStatus.ended;
    event.endedAt = new Date();
    await event.save();

    // Emit socket event to conversation participants
    conversation.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("conversation:event:ended", {
        conversationId,
        eventId: event._id.toString(),
        type: event.type,
      });
    });

    res.json({
      message: "Event ended successfully",
      event: {
        id: event._id,
        type: event.type,
        status: event.status,
        endedAt: event.endedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cleanup empty calls (to be called by cron/scheduler)
export const cleanupEmptyCalls = async () => {
  try {
    const activeEvents = await ConversationEventModel.find({
      status: ConversationEventStatus.active,
    });

    if (activeEvents.length === 0) return;

    for (const event of activeEvents) {
      // Check if event is older than 1 minute
      const ONE_MINUTE = 60 * 1000;
      const eventTime = (
        event as unknown as { createdAt: Date }
      ).createdAt.getTime();
      if (Date.now() - eventTime < ONE_MINUTE) continue;

      try {
        // Query Stream for call stats
        // Determine call type based on event type
        const callType = event.type === "audio_call" ? "audio_room" : "default";

        if (!event.streamCallId) continue;

        const { calls } = await videoClient.video.queryCalls({
          filter_conditions: {
            id: event.streamCallId,
          },
        });

        if (calls.length > 0) {
          const call = calls[0];
          // If no participants, end the call
          // @ts-ignore - stats/session property access depends on SDK version, using safe access
          const participantCount =
            (call as any).stats?.participant_count ??
            (call as any).session?.participants?.length ??
            0;

          if (participantCount === 0) {
            console.log(`[cleanup] Ending empty call: ${event._id}`);

            // End the GetStream call
            const streamCall = videoClient.video.call(
              callType,
              event.streamCallId
            );
            await streamCall.end();

            // Update DB
            event.status = ConversationEventStatus.ended;
            event.endedAt = new Date();
            await event.save();

            // Emit socket event to participants
            const conversation = await ConversationModel.findById(
              event.conversationId
            ).select("participants");
            if (conversation) {
              conversation.participants.forEach((participantId) => {
                io.to(`user:${participantId}`).emit(
                  "conversation:event:ended",
                  {
                    conversationId: event.conversationId,
                    eventId: event._id.toString(),
                    type: event.type,
                  }
                );
              });
            }
          }
        }
      } catch (err) {
        console.error(`[cleanup] Error checking call ${event._id}:`, err);
      }
    }
  } catch (error) {
    console.error("[cleanup] Fatal error in call cleanup:", error);
  }
};
