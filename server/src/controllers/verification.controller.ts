import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import { VerificationRequestModel } from "../models/verification-request.model";
import { NotificationType, VerificationStatus, UserRole } from "../models/common";
import { createNotification } from "../services/notification";
import {
  sendVerificationRequestSubmittedAdminEmail,
  sendVerificationRequestApprovedUserEmail,
  sendVerificationRequestRejectedUserEmail,
} from "../services/email";
import { env } from "../config/env";
import {
  createVerificationRequestSchema,
  reviewVerificationRequestSchema,
} from "../validators/verification.validator";

export const createVerificationRequest: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = createVerificationRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.verified) {
      res.status(400).json({ message: "Your account is already verified" });
      return;
    }

    const existingRequest = await VerificationRequestModel.findOne({
      userId,
      status: VerificationStatus.pending,
    });

    if (existingRequest) {
      res.status(400).json({
        message: "You already have a pending verification request",
        requestId: existingRequest._id,
      });
      return;
    }

    const { documentType, documentFrontUrl, documentBackUrl, selfieUrl } = validation.data;

    const verificationRequest = await VerificationRequestModel.create({
      userId,
      documentType,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
      status: VerificationStatus.pending,
    });

    const adminUsers = await UserModel.find({ role: { $in: [UserRole.admin, UserRole.moderator] } }).select(
      "_id email firstName lastName username"
    );
    const reviewUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/admin/dashboard/verification/requests?requestId=${verificationRequest._id}`;

    await Promise.all(
      adminUsers.map(async (adminUser) => {
        await createNotification({
          userId: adminUser._id.toString(),
          actorId: userId,
          type: NotificationType.verification_request_submitted,
          targetId: verificationRequest._id.toString(),
          url: "/dashboard/verification/requests",
        });

        if (adminUser.email) {
          await sendVerificationRequestSubmittedAdminEmail({
            to: adminUser.email,
            userDisplayName: `${user.firstName} ${user.lastName}`,
            username: user.username,
            reviewUrl,
          });
        }
      })
    );

    res.status(201).json({
      message: "Verification request submitted successfully",
      request: {
        id: verificationRequest._id,
        documentType: verificationRequest.documentType,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVerificationRequests: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const requests = await VerificationRequestModel.find({ userId })
      .select("-documentFrontUrl -documentBackUrl -selfieUrl")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

export const getVerificationRequestStatus: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { requestId } = req.params;

    const request = await VerificationRequestModel.findOne({
      _id: requestId,
      userId,
    }).select("-documentFrontUrl -documentBackUrl -selfieUrl");

    if (!request) {
      res.status(404).json({ message: "Verification request not found" });
      return;
    }

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

export const cancelVerificationRequest: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { requestId } = req.params;

    const request = await VerificationRequestModel.findOne({
      _id: requestId,
      userId,
      status: VerificationStatus.pending,
    });

    if (!request) {
      res.status(404).json({ message: "Pending verification request not found" });
      return;
    }

    await VerificationRequestModel.deleteOne({ _id: requestId });

    res.json({ message: "Verification request cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllVerificationRequests: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const admin = await UserModel.findById(userId);
    if (!admin || (admin.role !== UserRole.admin && admin.role !== UserRole.moderator)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const { status, page = "1", limit = "20" } = req.query;

    const query: Record<string, unknown> = {};
    if (status && Object.values(VerificationStatus).includes(status as typeof VerificationStatus[keyof typeof VerificationStatus])) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      VerificationRequestModel.find(query)
        .populate("userId", "firstName lastName username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      VerificationRequestModel.countDocuments(query),
    ]);

    res.json({
      requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationRequestById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const admin = await UserModel.findById(userId);
    if (!admin || (admin.role !== UserRole.admin && admin.role !== UserRole.moderator)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const { requestId } = req.params;

    const request = await VerificationRequestModel.findById(requestId)
      .populate("userId", "firstName lastName username email avatar")
      .populate("reviewedBy", "firstName lastName username");

    if (!request) {
      res.status(404).json({ message: "Verification request not found" });
      return;
    }

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

export const reviewVerificationRequest: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const admin = await UserModel.findById(userId);
    if (!admin || (admin.role !== UserRole.admin && admin.role !== UserRole.moderator)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const validation = reviewVerificationRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { requestId } = req.params;
    const { status, adminNotes } = validation.data;

    const request = await VerificationRequestModel.findOne({
      _id: requestId,
      status: VerificationStatus.pending,
    });

    if (!request) {
      res.status(404).json({ message: "Pending verification request not found" });
      return;
    }

    request.status = status;
    request.adminNotes = adminNotes;
    request.reviewedBy = admin._id;
    request.reviewedAt = new Date();
    await request.save();

    const requestUser = await UserModel.findById(request.userId).select("email firstName");
    const payUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/profile`;
    const retryUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/profile`;

    if (status === VerificationStatus.approved) {
      await createNotification({
        userId: request.userId.toString(),
        actorId: admin._id.toString(),
        type: NotificationType.verification_request_approved,
        targetId: request._id.toString(),
        url: "/profile",
      });

      if (requestUser?.email) {
        await sendVerificationRequestApprovedUserEmail({
          to: requestUser.email,
          firstName: requestUser.firstName,
          payUrl,
        });
      }
    }

    if (status === VerificationStatus.rejected) {
      await createNotification({
        userId: request.userId.toString(),
        actorId: admin._id.toString(),
        type: NotificationType.verification_request_rejected,
        targetId: request._id.toString(),
        url: "/profile",
      });

      if (requestUser?.email) {
        await sendVerificationRequestRejectedUserEmail({
          to: requestUser.email,
          firstName: requestUser.firstName,
          reason: adminNotes,
          retryUrl,
        });
      }
    }

    res.json({
      message: `Verification request ${status}`,
      request: {
        id: request._id,
        status: request.status,
        adminNotes: request.adminNotes,
        reviewedAt: request.reviewedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationStats: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const admin = await UserModel.findById(userId);
    if (!admin || (admin.role !== UserRole.admin && admin.role !== UserRole.moderator)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const [pending, approved, rejected, total] = await Promise.all([
      VerificationRequestModel.countDocuments({ status: VerificationStatus.pending }),
      VerificationRequestModel.countDocuments({ status: VerificationStatus.approved }),
      VerificationRequestModel.countDocuments({ status: VerificationStatus.rejected }),
      VerificationRequestModel.countDocuments(),
    ]);

    res.json({
      stats: {
        pending,
        approved,
        rejected,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};
