import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import { Types } from "mongoose";

import { env } from "../config/env";
import {
  FeaturedRoomModel,
  FeaturedRoomStatus,
  RoomModel,
  RoomMemberModel,
  RoomMemberRole,
  UserModel,
} from "../models";

const TAP_API_URL = "https://api.tap.company/v2/charges";

const FEATURED_ROOM_PRICE_PER_DAY = 10;

function getUserId(req: Request): Types.ObjectId {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return new Types.ObjectId(userId);
}

export async function initiateFeaturedRoomPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const { roomId } = req.params;
    const { days, currency = "USD" } = req.body;

    if (!Types.ObjectId.isValid(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    if (!days || days < 1 || days > 365) {
      res.status(400).json({ message: "Days must be between 1 and 365" });
      return;
    }

    const room = await RoomModel.findById(roomId);
    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.deletedAt) {
      res.status(400).json({ message: "Room has been deleted" });
      return;
    }

    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
    });

    if (!membership || membership.role !== RoomMemberRole.owner) {
      res.status(403).json({ message: "Only room owners can feature their rooms" });
      return;
    }

    const activeFeatured = await FeaturedRoomModel.findOne({
      roomId,
      status: FeaturedRoomStatus.active,
      endDate: { $gte: new Date() },
    });

    if (activeFeatured) {
      res.status(400).json({
        message: "This room is already featured",
        endDate: activeFeatured.endDate,
      });
      return;
    }

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

    const amount = FEATURED_ROOM_PRICE_PER_DAY * days;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const response = await axios.post(
      TAP_API_URL,
      {
        amount,
        currency,
        threeDSecure: true,
        save_card: false,
        description: `Featured listing for room: ${room.name} (${days} days)`,
        statement_descriptor: "LamatFikr Featured",
        customer: {
          email: user.email,
        },
        metadata: {
          roomId: roomId,
          userId: userId.toString(),
          days: days.toString(),
          type: "featured_room",
        },
        source: {
          id: "src_all",
        },
        redirect: {
          url: `${env.FRONTEND_URL}/rooms/${roomId}/featured/callback`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    await FeaturedRoomModel.create({
      roomId,
      userId,
      startDate,
      endDate,
      days,
      amount,
      currency,
      status: FeaturedRoomStatus.pending,
      tapChargeId: response.data.id,
      metadata: {
        transactionUrl: response.data.transaction?.url,
      },
    });

    res.json({
      message: "Featured room payment initiated",
      redirectUrl: response.data.transaction?.url,
      chargeId: response.data.id,
      amount,
      days,
      pricePerDay: FEATURED_ROOM_PRICE_PER_DAY,
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

export async function verifyFeaturedRoomPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
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

    const response = await axios.get(`https://api.tap.company/v2/charges/${tap_id}`, {
      headers: {
        Authorization: `Bearer ${tapSecretKey}`,
      },
    });

    const chargeData = response.data;
    console.log("Featured Room Charge Data: ", JSON.stringify(chargeData, null, 2));

    if (chargeData.status !== "CAPTURED") {
      await FeaturedRoomModel.updateOne(
        { tapChargeId: tap_id },
        { status: FeaturedRoomStatus.cancelled }
      );

      res.status(400).json({
        message: "Payment was not successful",
        status: chargeData.status,
      });
      return;
    }

    const featuredRoom = await FeaturedRoomModel.findOne({
      tapChargeId: tap_id,
      roomId,
      userId,
    });

    if (!featuredRoom) {
      res.status(400).json({ message: "Featured room record not found" });
      return;
    }

    if (featuredRoom.status === FeaturedRoomStatus.active) {
      res.json({
        message: "Room is already featured",
        featuredRoom: {
          id: featuredRoom._id,
          startDate: featuredRoom.startDate,
          endDate: featuredRoom.endDate,
          days: featuredRoom.days,
          status: featuredRoom.status,
        },
      });
      return;
    }

    featuredRoom.status = FeaturedRoomStatus.active;
    await featuredRoom.save();

    res.json({
      message: "Room featured successfully",
      featuredRoom: {
        id: featuredRoom._id,
        startDate: featuredRoom.startDate,
        endDate: featuredRoom.endDate,
        days: featuredRoom.days,
        amount: featuredRoom.amount,
        currency: featuredRoom.currency,
        status: featuredRoom.status,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Payment Verification Error:", error.response?.data);
      res.status(500).json({ message: "Payment verification failed", error: error.response?.data });
      return;
    }
    next(error);
  }
}

export async function getFeaturedRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();

    const featuredRooms = await FeaturedRoomModel.find({
      status: FeaturedRoomStatus.active,
      endDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "roomId",
        select: "name description image category membershipType price currency memberCount",
      })
      .populate({
        path: "userId",
        select: "username fullName profilePicture",
      });

    const total = await FeaturedRoomModel.countDocuments({
      status: FeaturedRoomStatus.active,
      endDate: { $gte: now },
    });

    res.json({
      featuredRooms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomFeaturedStatus(req: Request, res: Response, next: NextFunction) {
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
    });

    if (!membership || membership.role !== RoomMemberRole.owner) {
      res.status(403).json({ message: "Only room owners can view featured status" });
      return;
    }

    const now = new Date();
    const activeFeatured = await FeaturedRoomModel.findOne({
      roomId,
      status: FeaturedRoomStatus.active,
      endDate: { $gte: now },
    });

    const allFeatured = await FeaturedRoomModel.find({
      roomId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      isFeatured: !!activeFeatured,
      activeFeatured: activeFeatured
        ? {
            id: activeFeatured._id,
            startDate: activeFeatured.startDate,
            endDate: activeFeatured.endDate,
            days: activeFeatured.days,
            amount: activeFeatured.amount,
            currency: activeFeatured.currency,
            status: activeFeatured.status,
          }
        : null,
      history: allFeatured,
      pricePerDay: FEATURED_ROOM_PRICE_PER_DAY,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelFeaturedRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { roomId, featuredId } = req.params;

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(featuredId)) {
      res.status(400).json({ message: "Invalid room ID or featured ID" });
      return;
    }

    const membership = await RoomMemberModel.findOne({
      roomId,
      userId,
    });

    if (!membership || membership.role !== RoomMemberRole.owner) {
      res.status(403).json({ message: "Only room owners can cancel featured listings" });
      return;
    }

    const featuredRoom = await FeaturedRoomModel.findOne({
      _id: featuredId,
      roomId,
      userId,
    });

    if (!featuredRoom) {
      res.status(404).json({ message: "Featured room record not found" });
      return;
    }

    if (featuredRoom.status === FeaturedRoomStatus.cancelled || featuredRoom.status === FeaturedRoomStatus.expired) {
      res.status(400).json({ message: "Featured room is already cancelled or expired" });
      return;
    }

    featuredRoom.status = FeaturedRoomStatus.cancelled;
    await featuredRoom.save();

    res.json({
      message: "Featured room cancelled successfully",
      featuredRoom: {
        id: featuredRoom._id,
        status: featuredRoom.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function expireFeaturedRooms() {
  try {
    const now = new Date();
    const result = await FeaturedRoomModel.updateMany(
      {
        status: FeaturedRoomStatus.active,
        endDate: { $lt: now },
      },
      {
        status: FeaturedRoomStatus.expired,
      }
    );

    console.log(`Expired ${result.modifiedCount} featured rooms`);
    return result.modifiedCount;
  } catch (error) {
    console.error("Error expiring featured rooms:", error);
    throw error;
  }
}
