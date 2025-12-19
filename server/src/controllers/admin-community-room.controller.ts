import type { RequestHandler } from "express";
import { Types } from "mongoose";

import {
  CommunityMemberModel,
  CommunityMemberRole,
  CommunityMessageModel,
  CommunityModel,
  FeaturedRoomModel,
  FeaturedRoomStatus,
  RoomMemberModel,
  RoomMemberRole,
  RoomMemberStatus,
  RoomMessageModel,
  RoomModel,
} from "../models";

// ----------------- COMMUNITIES -----------------

export const listAdminCommunities: RequestHandler = async (req, res, next) => {
  try {
    const { page = "1", limit = "20", q, category, deleted = "active" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (q && typeof q === "string" && q.trim()) {
      const s = q.trim();
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }

    const [communities, total] = await Promise.all([
      CommunityModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("ownerId", "username firstName lastName avatar verified")
        .lean(),
      CommunityModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      communities,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteCommunity: RequestHandler = async (req, res, next) => {
  try {
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const updated = await CommunityModel.findByIdAndUpdate(
      communityId,
      { deletedAt: new Date() },
      { new: true }
    )
      .populate("ownerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Community not found" });
      return;
    }

    await Promise.all([
      CommunityMemberModel.updateMany({ communityId }, { deletedAt: new Date() }),
      CommunityMessageModel.updateMany({ communityId }, { deletedAt: new Date() }),
    ]);

    res.json({ success: true, community: updated });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreCommunity: RequestHandler = async (req, res, next) => {
  try {
    const { communityId } = req.params;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const updated = await CommunityModel.findByIdAndUpdate(
      communityId,
      { deletedAt: null },
      { new: true }
    )
      .populate("ownerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Community not found" });
      return;
    }

    // Do not auto-restore members/messages. Admin can manage manually.
    res.json({ success: true, community: updated });
  } catch (error) {
    next(error);
  }
};

export const listAdminCommunityMembers: RequestHandler = async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const { page = "1", limit = "50", role, deleted = "active" } = req.query;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { communityId: new Types.ObjectId(communityId) };

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    if (role && role !== "all") {
      filter.role = role;
    }

    const [members, total] = await Promise.all([
      CommunityMemberModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "username firstName lastName avatar verified")
        .lean(),
      CommunityMemberModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      members,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminSetCommunityMemberRole: RequestHandler = async (req, res, next) => {
  try {
    const { communityId, memberId } = req.params;
    const { role } = req.body as { role?: string };

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid community or member ID" });
      return;
    }

    if (!role || !(Object.values(CommunityMemberRole) as string[]).includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const updated = await CommunityMemberModel.findOneAndUpdate(
      { _id: memberId, communityId: new Types.ObjectId(communityId) },
      { role },
      { new: true }
    )
      .populate("userId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    res.json({ success: true, member: updated });
  } catch (error) {
    next(error);
  }
};

export const adminRemoveCommunityMember: RequestHandler = async (req, res, next) => {
  try {
    const { communityId, memberId } = req.params;

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid community or member ID" });
      return;
    }

    const member = await CommunityMemberModel.findOne({
      _id: memberId,
      communityId: new Types.ObjectId(communityId),
      deletedAt: null,
    });

    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (member.role === CommunityMemberRole.owner) {
      res.status(400).json({ message: "Cannot remove owner" });
      return;
    }

    await Promise.all([
      CommunityMemberModel.updateOne({ _id: member._id }, { deletedAt: new Date() }),
      CommunityModel.updateOne({ _id: communityId }, { $inc: { memberCount: -1 } }),
    ]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const listAdminCommunityMessages: RequestHandler = async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const { page = "1", limit = "50", deleted = "active" } = req.query;

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: "Invalid community ID" });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { communityId: new Types.ObjectId(communityId) };

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    const [messages, total] = await Promise.all([
      CommunityMessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("senderId", "username firstName lastName avatar verified")
        .lean(),
      CommunityMessageModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      messages,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteCommunityMessage: RequestHandler = async (req, res, next) => {
  try {
    const { communityId, messageId } = req.params;

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid community or message ID" });
      return;
    }

    const updated = await CommunityMessageModel.findOneAndUpdate(
      { _id: messageId, communityId: new Types.ObjectId(communityId) },
      { deletedAt: new Date() },
      { new: true }
    )
      .populate("senderId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    res.json({ success: true, message: updated });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreCommunityMessage: RequestHandler = async (req, res, next) => {
  try {
    const { communityId, messageId } = req.params;

    if (!Types.ObjectId.isValid(communityId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid community or message ID" });
      return;
    }

    const updated = await CommunityMessageModel.findOneAndUpdate(
      { _id: messageId, communityId: new Types.ObjectId(communityId) },
      { deletedAt: null },
      { new: true }
    )
      .populate("senderId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    res.json({ success: true, message: updated });
  } catch (error) {
    next(error);
  }
};

// ----------------- ROOMS -----------------

export const listAdminRooms: RequestHandler = async (req, res, next) => {
  try {
    const { page = "1", limit = "20", q, category, membershipType, deleted = "active" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (membershipType && membershipType !== "all") {
      filter.membershipType = membershipType;
    }

    if (q && typeof q === "string" && q.trim()) {
      const s = q.trim();
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }

    const [rooms, total] = await Promise.all([
      RoomModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("ownerId", "username firstName lastName avatar verified")
        .lean(),
      RoomModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      rooms,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteRoom: RequestHandler = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const updated = await RoomModel.findByIdAndUpdate(roomId, { deletedAt: new Date() }, { new: true })
      .populate("ownerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    await Promise.all([
      RoomMemberModel.updateMany({ roomId }, { deletedAt: new Date() }),
      RoomMessageModel.updateMany({ roomId }, { deletedAt: new Date() }),
    ]);

    res.json({ success: true, room: updated });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreRoom: RequestHandler = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const updated = await RoomModel.findByIdAndUpdate(roomId, { deletedAt: null }, { new: true })
      .populate("ownerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    res.json({ success: true, room: updated });
  } catch (error) {
    next(error);
  }
};

export const listAdminRoomMembers: RequestHandler = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page = "1", limit = "50", role, status, deleted = "active" } = req.query;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { roomId: new Types.ObjectId(roomId) };

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    if (role && role !== "all") {
      filter.role = role;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const [members, total] = await Promise.all([
      RoomMemberModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "username firstName lastName avatar verified")
        .lean(),
      RoomMemberModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      members,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminSetRoomMemberRole: RequestHandler = async (req, res, next) => {
  try {
    const { roomId, memberId } = req.params;
    const { role } = req.body as { role?: string };

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid room or member ID" });
      return;
    }

    if (!role || !(Object.values(RoomMemberRole) as string[]).includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const member = await RoomMemberModel.findOne({ _id: memberId, roomId: new Types.ObjectId(roomId) });
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (member.role === RoomMemberRole.owner && role !== RoomMemberRole.owner) {
      res.status(400).json({ message: "Cannot change owner role" });
      return;
    }

    const updated = await RoomMemberModel.findOneAndUpdate(
      { _id: memberId, roomId: new Types.ObjectId(roomId) },
      { role },
      { new: true }
    )
      .populate("userId", "username firstName lastName avatar verified")
      .lean();

    res.json({ success: true, member: updated });
  } catch (error) {
    next(error);
  }
};

export const adminSetRoomMemberStatus: RequestHandler = async (req, res, next) => {
  try {
    const { roomId, memberId } = req.params;
    const { status } = req.body as { status?: string };

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid room or member ID" });
      return;
    }

    if (!status || !(Object.values(RoomMemberStatus) as string[]).includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const updated = await RoomMemberModel.findOneAndUpdate(
      { _id: memberId, roomId: new Types.ObjectId(roomId) },
      { status },
      { new: true }
    )
      .populate("userId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    res.json({ success: true, member: updated });
  } catch (error) {
    next(error);
  }
};

export const adminRemoveRoomMember: RequestHandler = async (req, res, next) => {
  try {
    const { roomId, memberId } = req.params;

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid room or member ID" });
      return;
    }

    const member = await RoomMemberModel.findOne({
      _id: memberId,
      roomId: new Types.ObjectId(roomId),
      deletedAt: null,
    });

    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (member.role === RoomMemberRole.owner) {
      res.status(400).json({ message: "Cannot remove owner" });
      return;
    }

    await RoomMemberModel.updateOne({ _id: member._id }, { deletedAt: new Date() });

    // Only decrement if they were approved.
    if (member.status === RoomMemberStatus.approved) {
      await RoomModel.updateOne({ _id: roomId }, { $inc: { memberCount: -1 } });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const listAdminRoomMessages: RequestHandler = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page = "1", limit = "50", deleted = "active" } = req.query;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { roomId: new Types.ObjectId(roomId) };

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    const [messages, total] = await Promise.all([
      RoomMessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("senderId", "username firstName lastName avatar verified")
        .lean(),
      RoomMessageModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      messages,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteRoomMessage: RequestHandler = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params;

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid room or message ID" });
      return;
    }

    const updated = await RoomMessageModel.findOneAndUpdate(
      { _id: messageId, roomId: new Types.ObjectId(roomId) },
      { deletedAt: new Date() },
      { new: true }
    )
      .populate("senderId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    res.json({ success: true, message: updated });
  } catch (error) {
    next(error);
  }
};

export const adminRestoreRoomMessage: RequestHandler = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params;

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "Invalid room or message ID" });
      return;
    }

    const updated = await RoomMessageModel.findOneAndUpdate(
      { _id: messageId, roomId: new Types.ObjectId(roomId) },
      { deletedAt: null },
      { new: true }
    )
      .populate("senderId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    res.json({ success: true, message: updated });
  } catch (error) {
    next(error);
  }
};

// ----------------- FEATURED ROOMS -----------------

export const listAdminFeaturedRooms: RequestHandler = async (req, res, next) => {
  try {
    const { page = "1", limit = "20", status = "active" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (status && status !== "all") filter.status = status;

    const [featuredRooms, total] = await Promise.all([
      FeaturedRoomModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "roomId",
          select: "name description image category membershipType price currency memberCount deletedAt",
        })
        .populate({
          path: "userId",
          select: "username firstName lastName avatar verified",
        })
        .lean(),
      FeaturedRoomModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      featuredRooms,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminCancelFeaturedRoom: RequestHandler = async (req, res, next) => {
  try {
    const { featuredId } = req.params;

    if (!Types.ObjectId.isValid(featuredId)) {
      res.status(400).json({ message: "Invalid featured ID" });
      return;
    }

    const updated = await FeaturedRoomModel.findByIdAndUpdate(
      featuredId,
      { status: FeaturedRoomStatus.cancelled },
      { new: true }
    )
      .populate({
        path: "roomId",
        select: "name description image category membershipType price currency memberCount deletedAt",
      })
      .populate({
        path: "userId",
        select: "username firstName lastName avatar verified",
      })
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Featured record not found" });
      return;
    }

    res.json({ success: true, featuredRoom: updated });
  } catch (error) {
    next(error);
  }
};

export const adminExpireFeaturedRoom: RequestHandler = async (req, res, next) => {
  try {
    const { featuredId } = req.params;

    if (!Types.ObjectId.isValid(featuredId)) {
      res.status(400).json({ message: "Invalid featured ID" });
      return;
    }

    const updated = await FeaturedRoomModel.findByIdAndUpdate(
      featuredId,
      { status: FeaturedRoomStatus.expired },
      { new: true }
    )
      .populate({
        path: "roomId",
        select: "name description image category membershipType price currency memberCount deletedAt",
      })
      .populate({
        path: "userId",
        select: "username firstName lastName avatar verified",
      })
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Featured record not found" });
      return;
    }

    res.json({ success: true, featuredRoom: updated });
  } catch (error) {
    next(error);
  }
};
