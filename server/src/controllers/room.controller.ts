import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import { Types } from "mongoose";

import { env } from "../config/env";
import {
  RoomModel,
  RoomMemberModel,
  RoomMemberRole,
  RoomMemberStatus,
  RoomMessageModel,
  RoomPaymentModel,
  PaymentStatus,
  RoomMembershipType,
  RoomInviteLinkModel,
  UserModel,
} from "../models";
import {
  sendRoomPaymentCapturedOwnerEmail,
  sendRoomPaymentCapturedPayerEmail,
} from "../services/email";

const TAP_API_URL = "https://api.tap.company/v2/charges";

// Helper to get authenticated user ID
function getUserId(req: Request): Types.ObjectId {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return new Types.ObjectId(userId);
}

// Create a new room
export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { name, description, image, category, membershipType, price, currency, isPrivate } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({ message: "Name, description, and category are required" });
      return;
    }

    if (membershipType === RoomMembershipType.paid && (!price || price <= 0)) {
      res.status(400).json({ message: "Price is required for paid rooms" });
      return;
    }

    const room = await RoomModel.create({
      name,
      description,
      image,
      category,
      membershipType: membershipType || RoomMembershipType.free,
      price: membershipType === RoomMembershipType.paid ? price : undefined,
      currency: membershipType === RoomMembershipType.paid ? (currency || "USD") : undefined,
      isPrivate: isPrivate || false,
      ownerId: userId,
      memberCount: 1,
    });

    // Add creator as owner member
    await RoomMemberModel.create({
      roomId: room._id,
      userId,
      role: RoomMemberRole.owner,
      status: RoomMemberStatus.approved,
    });

    res.status(201).json({
      message: "Room created successfully",
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        image: room.image,
        category: room.category,
        membershipType: room.membershipType,
        price: room.price,
        currency: room.currency,
        isPrivate: room.isPrivate,
        memberCount: room.memberCount,
        createdAt: (room as unknown as { createdAt: Date }).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get all rooms (with search and filters)
export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { search, category, membershipType, filter, page = 1, limit = 20 } = req.query;

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

    // Membership type filter
    if (membershipType && typeof membershipType === "string") {
      query.membershipType = membershipType;
    }

    // Get user's room memberships with lastReadAt
    const userMemberships = await RoomMemberModel.find({
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    }).select("roomId role lastReadAt");

    const userRoomIds = userMemberships.map((m) => m.roomId.toString());
    const userRoleMap = new Map(userMemberships.map((m) => [m.roomId.toString(), m.role]));
    const userLastReadMap = new Map(userMemberships.map((m) => [m.roomId.toString(), m.lastReadAt]));

    // Filter by ownership if requested
    if (filter === "owned") {
      query.ownerId = userId;
    } else if (filter === "joined") {
      query._id = { $in: userMemberships.map((m) => m.roomId) };
    } else {
      // For "all" filter: show public rooms + private rooms where user is a member
      query.$or = [
        { isPrivate: false },
        { _id: { $in: userMemberships.map((m) => m.roomId) } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rooms, total] = await Promise.all([
      RoomModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("ownerId", "username displayName avatar")
        .lean(),
      RoomModel.countDocuments(query),
    ]);

    // Get last messages for each room
    const roomIds = rooms.map((r) => r._id);
    const lastMessages = await RoomMessageModel.aggregate([
      { $match: { roomId: { $in: roomIds }, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$roomId", lastMessage: { $first: "$$ROOT" } } },
    ]);

    const lastMessageMap = new Map(lastMessages.map((m) => [m._id.toString(), m.lastMessage]));

    // Get unread counts for each room based on lastReadAt
    // We need to calculate this per-room since each has a different lastReadAt
    const memberRoomIds = userMemberships.map((m) => m.roomId);
    const unreadCountPromises = memberRoomIds.map(async (roomId) => {
      const lastReadAt = userLastReadMap.get(roomId.toString());
      const matchQuery: Record<string, unknown> = {
        roomId,
        deletedAt: null,
        senderId: { $ne: userId },
      };
      
      // If user has a lastReadAt, count messages after that time
      // Otherwise, count all messages (user has never read the room)
      if (lastReadAt) {
        matchQuery.createdAt = { $gt: lastReadAt };
      }
      
      const count = await RoomMessageModel.countDocuments(matchQuery);
      return { roomId: roomId.toString(), count };
    });
    
    const unreadResults = await Promise.all(unreadCountPromises);
    const unreadMap = new Map(unreadResults.map((u) => [u.roomId, u.count]));

    const roomsWithDetails = rooms.map((room) => {
      const roomIdStr = room._id.toString();
      const lastMsg = lastMessageMap.get(roomIdStr);
      const isMember = userRoomIds.includes(roomIdStr);
      const role = userRoleMap.get(roomIdStr) || null;

      return {
        id: room._id,
        name: room.name,
        description: room.description,
        image: room.image,
        category: room.category,
        membershipType: room.membershipType,
        price: room.price,
        currency: room.currency,
        isPrivate: room.isPrivate,
        memberCount: room.memberCount,
        owner: room.ownerId,
        isMember,
        role,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unreadCount: isMember ? (unreadMap.get(roomIdStr) || 0) : 0,
        createdAt: (room as unknown as { createdAt: Date }).createdAt,
      };
    });

    res.json({
      rooms: roomsWithDetails,
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

// Get single room details
export async function getRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const room = await RoomModel.findOne({ _id: roomId, deletedAt: null })
      .populate("ownerId", "username displayName avatar")
      .lean();

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
    });

    // Check privacy: private rooms can only be accessed by members
    if (room.isPrivate && !membership) {
      res.status(403).json({ message: "You don't have access to this private room" });
      return;
    }

    // Get member count and online count (approximation)
    const memberCount = await RoomMemberModel.countDocuments({
      roomId,
      status: RoomMemberStatus.approved,
      deletedAt: null,
    });

    res.json({
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        image: room.image,
        category: room.category,
        membershipType: room.membershipType,
        price: room.price,
        currency: room.currency,
        isPrivate: room.isPrivate,
        memberCount,
        owner: room.ownerId,
        isMember: membership?.status === RoomMemberStatus.approved,
        role: membership?.role || null,
        membershipStatus: membership?.status || null,
        createdAt: (room as unknown as { createdAt: Date }).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Join a free room
export async function joinFreeRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const room = await RoomModel.findOne({ _id: roomId, deletedAt: null });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.membershipType === RoomMembershipType.paid) {
      res.status(400).json({ message: "This is a paid room. Please use the payment flow to join." });
      return;
    }

    // Check if already a member
    const existingMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
    });

    if (existingMembership) {
      if (existingMembership.status === RoomMemberStatus.approved) {
        res.status(400).json({ message: "You are already a member of this room" });
        return;
      }
      if (existingMembership.status === RoomMemberStatus.pending) {
        res.status(400).json({ message: "Your membership request is pending approval" });
        return;
      }
    }

    // For private rooms, set status to pending
    const status = room.isPrivate ? RoomMemberStatus.pending : RoomMemberStatus.approved;

    const membership = await RoomMemberModel.create({
      roomId,
      userId,
      role: RoomMemberRole.member,
      status,
    });

    // Update member count if approved
    if (status === RoomMemberStatus.approved) {
      await RoomModel.updateOne({ _id: roomId }, { $inc: { memberCount: 1 } });
    }

    res.status(201).json({
      message: room.isPrivate
        ? "Join request sent. Waiting for approval."
        : "Successfully joined the room",
      membership: {
        roomId: membership.roomId,
        role: membership.role,
        status: membership.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Initiate payment for paid room (Tap Payments)
export async function initiatePaidRoomJoin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const room = await RoomModel.findOne({ _id: roomId, deletedAt: null });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.membershipType !== RoomMembershipType.paid) {
      res.status(400).json({ message: "This is a free room. No payment required." });
      return;
    }

    // Check existing membership
    const existingMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
    });

    if (existingMembership) {
      if (existingMembership.status === RoomMemberStatus.approved) {
        res.status(400).json({ message: "You are already a member of this room" });
        return;
      }
      if (existingMembership.status === RoomMemberStatus.pending) {
        res.status(400).json({ message: "Your membership request is pending approval. Please wait for the room owner to approve your request before making payment." });
        return;
      }
      if (existingMembership.status === RoomMemberStatus.rejected) {
        res.status(400).json({ message: "Your membership request was rejected" });
        return;
      }
      // awaiting_payment status is allowed to proceed with payment
    } else if (room.isPrivate) {
      // For private paid rooms, user must have been approved first
      res.status(400).json({ message: "This is a private room. You need to request access and be approved before making payment." });
      return;
    }

    // Get user email for payment
    const { UserModel } = await import("../models/user.model.js");
    const user = await UserModel.findById(userId).select("email");
    if (!user?.email) {
      res.status(400).json({ message: "User email not found" });
      return;
    }

    const tapSecretKey = process.env.TAP_SECRET_KEY;
    if (!tapSecretKey) {
      res.status(501).json({ message: "Payment gateway not configured" });
      return;
    }

    // Create Tap charge
    const response = await axios.post(
      TAP_API_URL,
      {
        amount: room.price,
        currency: room.currency || "USD",
        threeDSecure: true,
        save_card: false,
        description: `Membership for room: ${room.name}`,
        statement_descriptor: "LamatFikr Room",
        customer: {
          email: user.email,
        },
        metadata: {
          roomId: roomId,
          userId: userId.toString(),
        },
        source: {
          id: "src_all",
        },
        redirect: {
          url: `${env.FRONTEND_URL}/rooms/payment/callback?roomId=${roomId}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Store pending payment
    await RoomPaymentModel.create({
      roomId,
      userId,
      amount: room.price!,
      currency: room.currency || "USD",
      tapChargeId: response.data.id,
      status: PaymentStatus.pending,
      metadata: {
        transactionUrl: response.data.transaction?.url,
      },
    });

    res.json({
      message: "Payment initiated",
      redirectUrl: response.data.transaction?.url,
      chargeId: response.data.id,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Payment Error:", error.response?.data);
      res.status(500).json({ message: "Payment initiation failed", error: error.response?.data });
      return;
    }
    next(error);
  }
}

// Verify payment and complete room join
export async function verifyPaymentAndJoin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { tap_id } = req.query;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    if (!tap_id || typeof tap_id !== "string") {
      res.status(400).json({ message: "Payment ID is required" });
      return;
    }

    const tapSecretKey = process.env.TAP_SECRET_KEY;
    if (!tapSecretKey) {
      res.status(501).json({ message: "Payment gateway not configured" });
      return;
    }

    // Verify payment with Tap
    const response = await axios.get(`https://api.tap.company/v2/charges/${tap_id}`, {
      headers: {
        Authorization: `Bearer ${tapSecretKey}`,
      },
    });

    const chargeData = response.data;
    console.log("Charge Data: ", JSON.stringify(chargeData, null, 2));

    // Check if payment was successful
    if (chargeData.status !== "CAPTURED") {
      // Update payment record
      await RoomPaymentModel.updateOne(
        { tapChargeId: tap_id },
        { status: PaymentStatus.failed }
      );

      res.status(400).json({
        message: "Payment was not successful",
        status: chargeData.status,
      });
      return;
    }

    // Verify the payment belongs to this user and room
    const payment = await RoomPaymentModel.findOne({
      tapChargeId: tap_id,
      roomId,
      userId,
    });

    if (!payment) {
      res.status(400).json({ message: "Payment record not found" });
      return;
    }

    if (payment.status === PaymentStatus.captured) {
      const emailFlags = (payment.metadata as any)?.emails || {};
      const shouldSendPayer = !emailFlags.payerRoomPaymentCaptured;
      const shouldSendOwner = !emailFlags.ownerRoomPaymentCaptured;

      if (shouldSendPayer || shouldSendOwner) {
        const room = await RoomModel.findById(roomId).select("name ownerId currency").lean();
        if (room) {
          const [payer, owner] = await Promise.all([
            UserModel.findById(userId).select("email firstName").lean(),
            UserModel.findById(room.ownerId).select("email firstName").lean(),
          ]);

          const roomUrl = `${env.FRONTEND_URL}/rooms`;

          let payerEmailSent = false;
          let ownerEmailSent = false;

          if (shouldSendPayer && payer?.email) {
            await sendRoomPaymentCapturedPayerEmail({
              to: payer.email,
              payerFirstName: payer.firstName || "there",
              roomName: room.name,
              amount: payment.amount,
              currency: payment.currency,
              roomUrl,
            });
            payerEmailSent = true;
          }

          if (shouldSendOwner && owner?.email) {
            await sendRoomPaymentCapturedOwnerEmail({
              to: owner.email,
              ownerFirstName: owner.firstName || "there",
              roomName: room.name,
              amount: payment.amount,
              currency: payment.currency,
              roomUrl,
            });
            ownerEmailSent = true;
          }

          const setUpdates: Record<string, boolean> = {};
          if (payerEmailSent) setUpdates["metadata.emails.payerRoomPaymentCaptured"] = true;
          if (ownerEmailSent) setUpdates["metadata.emails.ownerRoomPaymentCaptured"] = true;

          if (Object.keys(setUpdates).length > 0) {
            await RoomPaymentModel.updateOne({ _id: payment._id }, { $set: setUpdates });
          }
        }
      }

      // Payment already processed - user is already a member
      res.json({
        message: "Payment verified. You have successfully joined the room!",
        membership: {
          roomId,
          status: RoomMemberStatus.approved,
          paidAt: payment.paidAt,
        },
      });
      return;
    }

    // Update payment status
    await RoomPaymentModel.updateOne(
      { _id: payment._id },
      {
        status: PaymentStatus.captured,
        paidAt: new Date(),
      }
    );

    const emailFlags = (payment.metadata as any)?.emails || {};
    const shouldSendPayer = !emailFlags.payerRoomPaymentCaptured;
    const shouldSendOwner = !emailFlags.ownerRoomPaymentCaptured;

    if (shouldSendPayer || shouldSendOwner) {
      const room = await RoomModel.findById(roomId).select("name ownerId currency").lean();
      if (room) {
        const [payer, owner] = await Promise.all([
          UserModel.findById(userId).select("email firstName").lean(),
          UserModel.findById(room.ownerId).select("email firstName").lean(),
        ]);

        const roomUrl = `${env.FRONTEND_URL}/rooms`;

        let payerEmailSent = false;
        let ownerEmailSent = false;

        if (shouldSendPayer && payer?.email) {
          await sendRoomPaymentCapturedPayerEmail({
            to: payer.email,
            payerFirstName: payer.firstName || "there",
            roomName: room.name,
            amount: payment.amount,
            currency: payment.currency,
            roomUrl,
          });
          payerEmailSent = true;
        }

        if (shouldSendOwner && owner?.email) {
          await sendRoomPaymentCapturedOwnerEmail({
            to: owner.email,
            ownerFirstName: owner.firstName || "there",
            roomName: room.name,
            amount: payment.amount,
            currency: payment.currency,
            roomUrl,
          });
          ownerEmailSent = true;
        }

        const setUpdates: Record<string, boolean> = {};
        if (payerEmailSent) setUpdates["metadata.emails.payerRoomPaymentCaptured"] = true;
        if (ownerEmailSent) setUpdates["metadata.emails.ownerRoomPaymentCaptured"] = true;

        if (Object.keys(setUpdates).length > 0) {
          await RoomPaymentModel.updateOne({ _id: payment._id }, { $set: setUpdates });
        }
      }
    }

    // Check if membership already exists
    const existingMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
    });

    if (existingMembership) {
      // Update existing membership
      await RoomMemberModel.updateOne(
        { _id: existingMembership._id },
        {
          status: RoomMemberStatus.approved,
          paidAt: new Date(),
          paymentId: tap_id,
        }
      );
    } else {
      // Create new membership
      await RoomMemberModel.create({
        roomId,
        userId,
        role: RoomMemberRole.member,
        status: RoomMemberStatus.approved,
        paidAt: new Date(),
        paymentId: tap_id,
      });
    }

    // Update member count
    await RoomModel.updateOne({ _id: roomId }, { $inc: { memberCount: 1 } });

    res.json({
      message: "Payment verified. You have successfully joined the room!",
      membership: {
        roomId,
        status: RoomMemberStatus.approved,
        paidAt: new Date(),
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Verification Error:", error.response?.data);
      res.status(500).json({ message: "Payment verification failed" });
      return;
    }
    next(error);
  }
}

// Leave a room
export async function leaveRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
    });

    if (!membership) {
      res.status(404).json({ message: "You are not a member of this room" });
      return;
    }

    if (membership.role === RoomMemberRole.owner) {
      res.status(400).json({ message: "Room owner cannot leave. Transfer ownership or delete the room." });
      return;
    }

    // Soft delete membership
    await RoomMemberModel.updateOne(
      { _id: membership._id },
      { deletedAt: new Date() }
    );

    // Update member count
    if (membership.status === RoomMemberStatus.approved) {
      await RoomModel.updateOne({ _id: roomId }, { $inc: { memberCount: -1 } });
    }

    res.json({ message: "Successfully left the room" });
  } catch (error) {
    next(error);
  }
}

// Delete a room (owner only)
export async function deleteRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const room = await RoomModel.findOne({ _id: roomId, deletedAt: null });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.ownerId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Only the room owner can delete the room" });
      return;
    }

    // Soft delete room and all memberships
    await Promise.all([
      RoomModel.updateOne({ _id: roomId }, { deletedAt: new Date() }),
      RoomMemberModel.updateMany({ roomId }, { deletedAt: new Date() }),
    ]);

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// Update room settings (owner/admin only)
export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { name, description, image, category, isPrivate } = req.body;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!membership || (membership.role !== RoomMemberRole.owner && membership.role !== RoomMemberRole.admin)) {
      res.status(403).json({ message: "Only room owner or admin can update room settings" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (category) updateData.category = category;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const room = await RoomModel.findOneAndUpdate(
      { _id: roomId, deletedAt: null },
      updateData,
      { new: true }
    );

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    res.json({
      message: "Room updated successfully",
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        image: room.image,
        category: room.category,
        membershipType: room.membershipType,
        price: room.price,
        currency: room.currency,
        isPrivate: room.isPrivate,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get room members
export async function getRoomMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    // Check if user is a member
    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to view room members" });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [members, total] = await Promise.all([
      RoomMemberModel.find({
        roomId,
        deletedAt: null,
        status: RoomMemberStatus.approved,
      })
        .sort({ role: 1, createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "username displayName avatar")
        .lean(),
      RoomMemberModel.countDocuments({
        roomId,
        deletedAt: null,
        status: RoomMemberStatus.approved,
      }),
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

// Send message to room
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { content, media } = req.body;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    if (!content && (!media || media.length === 0)) {
      res.status(400).json({ message: "Message content or media is required" });
      return;
    }

    // Check if user is a member
    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to send messages" });
      return;
    }

    const message = await RoomMessageModel.create({
      roomId,
      senderId: userId,
      content,
      media: media || [],
    });

    const populatedMessage = await RoomMessageModel.findById(message._id)
      .populate("senderId", "username displayName avatar")
      .lean();

    res.status(201).json({
      message: "Message sent",
      data: {
        id: populatedMessage?._id,
        roomId: populatedMessage?.roomId,
        sender: populatedMessage?.senderId,
        content: populatedMessage?.content,
        media: populatedMessage?.media,
        createdAt: (populatedMessage as unknown as { createdAt: Date })?.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get room messages
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    // Check if user is a member
    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to view messages" });
      return;
    }

    const query: Record<string, unknown> = { roomId, deletedAt: null };

    // For pagination by timestamp
    if (before && typeof before === "string") {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await RoomMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("senderId", "username displayName avatar")
      .lean();

    res.json({
      messages: messages.reverse().map((m) => ({
        id: m._id,
        roomId: m.roomId,
        sender: m.senderId,
        content: m.content,
        media: m.media,
        createdAt: (m as unknown as { createdAt: Date }).createdAt,
      })),
      hasMore: messages.length === Number(limit),
    });
  } catch (error) {
    next(error);
  }
}

// Mark room messages as read
export async function markRoomAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    // Check if user is a member
    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!membership) {
      res.status(403).json({ message: "You must be a member to mark messages as read" });
      return;
    }

    // Update lastReadAt to current time
    await RoomMemberModel.updateOne(
      { _id: membership._id },
      { lastReadAt: new Date() }
    );

    res.json({ message: "Room marked as read" });
  } catch (error) {
    next(error);
  }
}

// Approve/reject membership request (owner/admin only)
export async function handleMembershipRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId, memberId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid room or member ID" });
      return;
    }

    // Check if user is owner or admin
    const userMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!userMembership || (userMembership.role !== RoomMemberRole.owner && userMembership.role !== RoomMemberRole.admin)) {
      res.status(403).json({ message: "Only room owner or admin can handle membership requests" });
      return;
    }

    const memberRequest = await RoomMemberModel.findOne({
      _id: memberId,
      roomId,
      status: RoomMemberStatus.pending,
      deletedAt: null,
    });

    if (!memberRequest) {
      res.status(404).json({ message: "Membership request not found" });
      return;
    }

    if (action === "approve") {
      // Get room to check if it's a paid room
      const room = await RoomModel.findOne({ _id: roomId, deletedAt: null });
      
      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      // For paid rooms, set status to awaiting_payment instead of approved
      const isPaidRoom = room.membershipType === RoomMembershipType.paid;
      const newStatus = isPaidRoom ? RoomMemberStatus.awaitingPayment : RoomMemberStatus.approved;

      await RoomMemberModel.updateOne(
        { _id: memberRequest._id },
        { status: newStatus }
      );

      // Only increment member count if directly approved (free rooms)
      if (!isPaidRoom) {
        await RoomModel.updateOne({ _id: roomId }, { $inc: { memberCount: 1 } });
      }

      res.json({ 
        message: isPaidRoom 
          ? "Request approved. User can now complete payment to join." 
          : "Membership approved",
        status: newStatus,
        isPaidRoom,
      });
    } else if (action === "reject") {
      await RoomMemberModel.updateOne(
        { _id: memberRequest._id },
        { status: RoomMemberStatus.rejected }
      );

      res.json({ message: "Membership rejected" });
    } else {
      res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
    }
  } catch (error) {
    next(error);
  }
}

// Get pending membership requests (owner/admin only)
export async function getPendingRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    // Check if user is owner or admin
    const userMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!userMembership || (userMembership.role !== RoomMemberRole.owner && userMembership.role !== RoomMemberRole.admin)) {
      res.status(403).json({ message: "Only room owner or admin can view pending requests" });
      return;
    }

    const pendingRequests = await RoomMemberModel.find({
      roomId,
      status: RoomMemberStatus.pending,
      deletedAt: null,
    })
      .populate("userId", "username displayName avatar")
      .lean();

    res.json({
      requests: pendingRequests.map((r) => ({
        id: r._id,
        user: r.userId,
        requestedAt: (r as unknown as { createdAt: Date }).createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// Generate invite link for private room (owner/admin only)
export async function generateInviteLink(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { expiresIn, maxUses } = req.body;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    const room = await RoomModel.findOne({ _id: roomId, deletedAt: null });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (!room.isPrivate) {
      res.status(400).json({ message: "Invite links are only available for private rooms" });
      return;
    }

    // Check if user is owner or admin
    const userMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!userMembership || (userMembership.role !== RoomMemberRole.owner && userMembership.role !== RoomMemberRole.admin)) {
      res.status(403).json({ message: "Only room owner or admin can generate invite links" });
      return;
    }

    // Generate unique token
    const token = generateToken();

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn && typeof expiresIn === "number") {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    const inviteLink = await RoomInviteLinkModel.create({
      roomId,
      createdBy: userId,
      token,
      expiresAt,
      maxUses: maxUses || null,
      usedCount: 0,
      isActive: true,
    });

    const shareUrl = `${env.FRONTEND_URL}/rooms/invite/${token}`;

    res.status(201).json({
      message: "Invite link generated successfully",
      inviteLink: {
        id: inviteLink._id,
        token: inviteLink.token,
        shareUrl,
        expiresAt: inviteLink.expiresAt,
        maxUses: inviteLink.maxUses,
        createdAt: (inviteLink as unknown as { createdAt: Date }).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get all invite links for a room (owner/admin only)
export async function getRoomInviteLinks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    // Check if user is owner or admin
    const userMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!userMembership || (userMembership.role !== RoomMemberRole.owner && userMembership.role !== RoomMemberRole.admin)) {
      res.status(403).json({ message: "Only room owner or admin can view invite links" });
      return;
    }

    const inviteLinks = await RoomInviteLinkModel.find({
      roomId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      inviteLinks: inviteLinks.map((link) => ({
        id: link._id,
        token: link.token,
        shareUrl: `${env.FRONTEND_URL}/rooms/invite/${link.token}`,
        expiresAt: link.expiresAt,
        maxUses: link.maxUses,
        usedCount: link.usedCount,
        isActive: link.isActive,
        createdAt: (link as unknown as { createdAt: Date }).createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// Revoke invite link (owner/admin only)
export async function revokeInviteLink(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId, linkId } = req.params;

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(linkId)) {
      res.status(400).json({ message: "Invalid room or link ID" });
      return;
    }

    // Check if user is owner or admin
    const userMembership = await RoomMemberModel.findOne({
      roomId,
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    });

    if (!userMembership || (userMembership.role !== RoomMemberRole.owner && userMembership.role !== RoomMemberRole.admin)) {
      res.status(403).json({ message: "Only room owner or admin can revoke invite links" });
      return;
    }

    const inviteLink = await RoomInviteLinkModel.findOne({
      _id: linkId,
      roomId,
      deletedAt: null,
    });

    if (!inviteLink) {
      res.status(404).json({ message: "Invite link not found" });
      return;
    }

    await RoomInviteLinkModel.updateOne(
      { _id: linkId },
      { isActive: false }
    );

    res.json({ message: "Invite link revoked successfully" });
  } catch (error) {
    next(error);
  }
}

// Join room via invite link
export async function joinRoomViaInviteLink(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { token } = req.params;

    if (!token || typeof token !== "string") {
      res.status(400).json({ message: "Invalid invite token" });
      return;
    }

    const inviteLink = await RoomInviteLinkModel.findOne({
      token,
      isActive: true,
      deletedAt: null,
    });

    if (!inviteLink) {
      res.status(404).json({ message: "Invite link not found or has been revoked" });
      return;
    }

    // Check if link has expired
    if (inviteLink.expiresAt && new Date() > inviteLink.expiresAt) {
      await RoomInviteLinkModel.updateOne(
        { _id: inviteLink._id },
        { isActive: false }
      );
      res.status(400).json({ message: "Invite link has expired" });
      return;
    }

    // Check if link has reached max uses
    if (inviteLink.maxUses && inviteLink.usedCount >= inviteLink.maxUses) {
      await RoomInviteLinkModel.updateOne(
        { _id: inviteLink._id },
        { isActive: false }
      );
      res.status(400).json({ message: "Invite link has reached maximum uses" });
      return;
    }

    const room = await RoomModel.findOne({ _id: inviteLink.roomId, deletedAt: null });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    // Check if already a member
    const existingMembership = await RoomMemberModel.findOne({
      roomId: inviteLink.roomId,
      userId,
      deletedAt: null,
    });

    if (existingMembership) {
      if (existingMembership.status === RoomMemberStatus.approved) {
        res.status(400).json({ message: "You are already a member of this room" });
        return;
      }
      if (existingMembership.status === RoomMemberStatus.pending) {
        // Return pending status with room info for better UX
        res.status(200).json({
          message: "Your membership request is pending approval",
          status: "pending",
          membership: {
            roomId: existingMembership.roomId,
            role: existingMembership.role,
            status: existingMembership.status,
          },
          room: {
            id: room._id,
            name: room.name,
            description: room.description,
            image: room.image,
            category: room.category,
            membershipType: room.membershipType,
            price: room.price,
            currency: room.currency,
          },
        });
        return;
      }
    }

    // For paid private rooms, set status to pending (owner must approve before payment)
    // For free private rooms with invite link, auto-approve
    const isPaidRoom = room.membershipType === RoomMembershipType.paid;
    const membershipStatus = isPaidRoom ? RoomMemberStatus.pending : RoomMemberStatus.approved;

    const membership = await RoomMemberModel.create({
      roomId: inviteLink.roomId,
      userId,
      role: RoomMemberRole.member,
      status: membershipStatus,
    });

    // Update member count only if approved
    if (membershipStatus === RoomMemberStatus.approved) {
      await RoomModel.updateOne({ _id: inviteLink.roomId }, { $inc: { memberCount: 1 } });
    }

    // Increment used count
    await RoomInviteLinkModel.updateOne(
      { _id: inviteLink._id },
      { $inc: { usedCount: 1 } }
    );

    if (isPaidRoom) {
      res.status(201).json({
        message: "Your request to join has been submitted. The room owner will review your request before you can proceed with payment.",
        status: "pending",
        membership: {
          roomId: membership.roomId,
          role: membership.role,
          status: membership.status,
        },
        room: {
          id: room._id,
          name: room.name,
          description: room.description,
          image: room.image,
          category: room.category,
          membershipType: room.membershipType,
          price: room.price,
          currency: room.currency,
        },
      });
    } else {
      res.status(201).json({
        message: "Successfully joined the room via invite link",
        status: "approved",
        membership: {
          roomId: membership.roomId,
          role: membership.role,
          status: membership.status,
        },
        room: {
          id: room._id,
          name: room.name,
          description: room.description,
          image: room.image,
          category: room.category,
          membershipType: room.membershipType,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

// Get total unread room messages count for sidebar
export async function getTotalUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);

    // Get user's room memberships with lastReadAt
    const userMemberships = await RoomMemberModel.find({
      userId,
      deletedAt: null,
      status: RoomMemberStatus.approved,
    }).select("roomId lastReadAt");

    if (userMemberships.length === 0) {
      res.json({ totalUnreadCount: 0 });
      return;
    }

    // Calculate unread count for each room based on lastReadAt
    const unreadCountPromises = userMemberships.map(async (membership) => {
      const matchQuery: Record<string, unknown> = {
        roomId: membership.roomId,
        deletedAt: null,
        senderId: { $ne: userId },
      };
      
      // If user has a lastReadAt, count messages after that time
      // Otherwise, count all messages (user has never read the room)
      if (membership.lastReadAt) {
        matchQuery.createdAt = { $gt: membership.lastReadAt };
      }
      
      return RoomMessageModel.countDocuments(matchQuery);
    });
    
    const unreadCounts = await Promise.all(unreadCountPromises);
    const totalUnreadCount = unreadCounts.reduce((sum, count) => sum + count, 0);

    res.json({ totalUnreadCount });
  } catch (error) {
    next(error);
  }
}

// Helper function to generate unique token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
