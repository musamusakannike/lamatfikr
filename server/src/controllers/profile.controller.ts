import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import axios from "axios";

import { UserModel } from "../models/user.model";
import { AuthProvider, VerificationStatus } from "../models/common";
import { VerifiedTagPaymentModel, VerifiedTagPaymentStatus } from "../models";
import { VerificationRequestModel } from "../models/verification-request.model";
import { env } from "../config/env";
import {
  updateProfileSchema,
  updateAvatarSchema,
  updateCoverPhotoSchema,
  updatePrivacySettingsSchema,
  changePasswordSchema,
} from "../validators/profile.validator";

const SALT_ROUNDS = 12;

const TAP_API_URL = "https://api.tap.company/v2/charges";
const VERIFIED_TAG_DURATION_DAYS = 30;
const DEFAULT_VERIFIED_TAG_PRICE = 30;
const VERIFIED_TAG_CURRENCY = "OMR";

import { SettingModel } from "../models";

async function getVerifiedTagPrice(): Promise<number> {
  const setting = await SettingModel.findOne({ key: "price_verification" });
  if (setting && typeof setting.value === "number") {
    return setting.value;
  }
  return DEFAULT_VERIFIED_TAG_PRICE;
}

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId).select(
      "-passwordHash -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const now = Date.now();
    const isPaidVerified = !!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > now;
    const profile: any = user.toObject();
    profile.verified = profile.verified || isPaidVerified;

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile: RequestHandler = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username }).select(
      "firstName lastName username avatar coverPhoto bio gender birthday relationshipStatus address nationality city occupation website workingAt school interests languagesSpoken verified paidVerifiedUntil role privacySettings createdAt"
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const publicProfile: Record<string, unknown> = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      verified:
        user.verified ||
        (!!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > Date.now()),
      role: user.role,
      createdAt: user.createdAt,
    };

    // Apply privacy settings for each field
    if (user.privacySettings?.whoCanSeeMyBirthday === "everyone") {
      publicProfile.birthday = user.birthday;
    }

    if (user.privacySettings?.whoCanSeeMyLocation === "everyone") {
      publicProfile.address = user.address;
    }

    if (user.privacySettings?.whoCanSeeMyGender === "everyone") {
      publicProfile.gender = user.gender;
    }

    if (user.privacySettings?.whoCanSeeMyNationality === "everyone") {
      publicProfile.nationality = user.nationality;
    }

    if (user.privacySettings?.whoCanSeeMyCity === "everyone") {
      publicProfile.city = user.city;
    }

    if (user.privacySettings?.whoCanSeeMyOccupation === "everyone") {
      publicProfile.occupation = user.occupation;
    }

    if (user.privacySettings?.whoCanSeeMyRelationshipStatus === "everyone") {
      publicProfile.relationshipStatus = user.relationshipStatus;
    }

    if (user.privacySettings?.whoCanSeeMyWebsite === "everyone") {
      publicProfile.website = user.website;
    }

    if (user.privacySettings?.whoCanSeeMyWorkingAt === "everyone") {
      publicProfile.workingAt = user.workingAt;
    }

    if (user.privacySettings?.whoCanSeeMySchool === "everyone") {
      publicProfile.school = user.school;
    }

    if (user.privacySettings?.whoCanSeeMyInterests === "everyone") {
      publicProfile.interests = user.interests;
    }

    if (user.privacySettings?.whoCanSeeMyLanguages === "everyone") {
      publicProfile.languagesSpoken = user.languagesSpoken;
    }

    res.json({ profile: publicProfile });
  } catch (error) {
    next(error);
  }
};

export const initiateVerifiedTagPurchase: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const tapSecretKey = env.TAP_SECRET_KEY;
    if (!tapSecretKey) {
      res.status(501).json({ message: "Payment gateway not configured" });
      return;
    }

    const user = await UserModel.findById(userId).select("email paidVerifiedUntil verified");
    if (!user?.email) {
      res.status(400).json({ message: "User email not found" });
      return;
    }

    const nowTs = Date.now();
    const isAlreadyPaidVerified = !!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > nowTs;
    if (user.verified || isAlreadyPaidVerified) {
      res.status(400).json({ message: "Your account is already verified" });
      return;
    }

    const approvedRequest = await VerificationRequestModel.findOne({
      userId,
      status: VerificationStatus.approved,
    }).sort({ reviewedAt: -1, createdAt: -1 });

    if (!approvedRequest) {
      const pendingRequest = await VerificationRequestModel.findOne({
        userId,
        status: VerificationStatus.pending,
      });

      if (pendingRequest) {
        res.status(403).json({
          message: "Your verification request is pending approval. Please wait for admin review before paying.",
        });
        return;
      }

      res.status(403).json({
        message: "You must submit your identification documents and get admin approval before paying for the verified badge.",
      });
      return;
    }

    const now = new Date();
    const startsAt = user.paidVerifiedUntil && user.paidVerifiedUntil > now ? user.paidVerifiedUntil : now;
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + VERIFIED_TAG_DURATION_DAYS);

    const price = await getVerifiedTagPrice();

    const response = await axios.post(
      TAP_API_URL,
      {
        amount: price,
        currency: VERIFIED_TAG_CURRENCY,
        threeDSecure: true,
        save_card: false,
        description: `Verified tag (${VERIFIED_TAG_DURATION_DAYS} days)`,
        statement_descriptor: "LamatFikr Verified",
        customer: {
          email: user.email,
        },
        metadata: {
          userId: userId.toString(),
          type: "verified_tag",
          durationDays: VERIFIED_TAG_DURATION_DAYS.toString(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        },
        source: {
          id: "src_all",
        },
        redirect: {
          url: `${env.FRONTEND_URL}/profile/verified/callback`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    await VerifiedTagPaymentModel.create({
      userId,
      amount: price,
      currency: VERIFIED_TAG_CURRENCY,
      tapChargeId: response.data.id,
      status: VerifiedTagPaymentStatus.pending,
      durationDays: VERIFIED_TAG_DURATION_DAYS,
      startsAt,
      endsAt,
      metadata: {
        transactionUrl: response.data.transaction?.url,
      },
    });

    res.json({
      message: "Payment initiated",
      redirectUrl: response.data.transaction?.url,
      chargeId: response.data.id,
      amount: price,
      currency: VERIFIED_TAG_CURRENCY,
      durationDays: VERIFIED_TAG_DURATION_DAYS,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Payment Error:", error.response?.data);
      res.status(500).json({ message: "Payment initiation failed", error: error.response?.data });
      return;
    }
    next(error);
  }
};

export const verifyVerifiedTagPurchase: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { tap_id } = req.query;
    if (!tap_id || typeof tap_id !== "string") {
      res.status(400).json({ message: "Payment ID is required" });
      return;
    }

    const tapSecretKey = env.TAP_SECRET_KEY;
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
    if (chargeData.status !== "CAPTURED") {
      await VerifiedTagPaymentModel.updateOne(
        { tapChargeId: tap_id, userId },
        { status: VerifiedTagPaymentStatus.failed }
      );

      res.status(400).json({
        message: "Payment was not successful",
        status: chargeData.status,
      });
      return;
    }

    const payment = await VerifiedTagPaymentModel.findOne({
      tapChargeId: tap_id,
      userId,
    });

    if (!payment) {
      res.status(400).json({ message: "Payment record not found" });
      return;
    }

    if (payment.status === VerifiedTagPaymentStatus.captured) {
      const user = await UserModel.findById(userId).select(
        "-passwordHash -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires"
      );
      res.json({
        message: "Payment already verified",
        profile: user,
        verifiedUntil: payment.endsAt,
      });
      return;
    }

    await VerifiedTagPaymentModel.updateOne(
      { _id: payment._id },
      {
        status: VerifiedTagPaymentStatus.captured,
        paidAt: new Date(),
      }
    );

    const user = await UserModel.findById(userId).select("paidVerifiedUntil verified");
    const currentUntil = user?.paidVerifiedUntil && user.paidVerifiedUntil > new Date() ? user.paidVerifiedUntil : new Date();
    const newUntil = payment.endsAt > currentUntil ? payment.endsAt : currentUntil;

    await UserModel.updateOne(
      { _id: userId },
      {
        paidVerifiedUntil: newUntil,
        paidVerifiedPurchasedAt: new Date(),
      }
    );

    const updatedUser = await UserModel.findById(userId).select(
      "-passwordHash -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires"
    );

    const updatedObj: any = updatedUser?.toObject();
    if (updatedObj) {
      updatedObj.verified =
        updatedObj.verified ||
        (!!updatedObj.paidVerifiedUntil && new Date(updatedObj.paidVerifiedUntil).getTime() > Date.now());
    }

    res.json({
      message: "Payment verified successfully",
      profile: updatedObj,
      verifiedUntil: newUntil,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Verification Error:", error.response?.data);
      res.status(500).json({ message: "Payment verification failed" });
      return;
    }
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const updateData = validation.data;

    if (updateData.birthday) {
      (updateData as Record<string, unknown>).birthday = new Date(updateData.birthday);
    }

    if (updateData.phone) {
      const existingPhone = await UserModel.findOne({
        phone: updateData.phone,
        _id: { $ne: userId },
      });
      if (existingPhone) {
        res.status(409).json({ message: "Phone number already in use" });
        return;
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(
      "-passwordHash -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: "Profile updated successfully",
      profile: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = updateAvatarSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { avatarUrl } = validation.data;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("avatar");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoverPhoto: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = updateCoverPhotoSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { coverPhotoUrl } = validation.data;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { coverPhoto: coverPhotoUrl },
      { new: true }
    ).select("coverPhoto");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: "Cover photo updated successfully",
      coverPhoto: user.coverPhoto,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrivacySettings: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId).select("privacySettings");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ privacySettings: user.privacySettings });
  } catch (error) {
    next(error);
  }
};

export const updatePrivacySettings: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = updatePrivacySettingsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const updateData: Record<string, string> = {};
    for (const [key, value] of Object.entries(validation.data)) {
      if (value !== undefined) {
        updateData[`privacySettings.${key}`] = value;
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("privacySettings");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: "Privacy settings updated successfully",
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.authProvider !== AuthProvider.email) {
      res.status(400).json({
        message: `Cannot change password for ${user.authProvider} accounts`,
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ message: "No password set for this account" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await UserModel.updateOne({ _id: userId }, { passwordHash: newPasswordHash });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { password } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.authProvider === AuthProvider.email && user.passwordHash) {
      if (!password) {
        res.status(400).json({ message: "Password is required to delete account" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Password is incorrect" });
        return;
      }
    }

    await UserModel.deleteOne({ _id: userId });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};
