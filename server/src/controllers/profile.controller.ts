import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";

import { UserModel } from "../models/user.model";
import { AuthProvider } from "../models/common";
import {
  updateProfileSchema,
  updateAvatarSchema,
  updateCoverPhotoSchema,
  updatePrivacySettingsSchema,
  changePasswordSchema,
} from "../validators/profile.validator";

const SALT_ROUNDS = 12;

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

    res.json({ profile: user });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile: RequestHandler = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username }).select(
      "firstName lastName username avatar coverPhoto bio gender birthday relationshipStatus address website workingAt school verified role privacySettings createdAt"
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
      verified: user.verified,
      role: user.role,
      createdAt: user.createdAt,
    };

    if (user.privacySettings?.whoCanSeeMyBirthday === "everyone") {
      publicProfile.birthday = user.birthday;
    }

    if (user.privacySettings?.whoCanSeeMyLocation === "everyone") {
      publicProfile.address = user.address;
    }

    publicProfile.relationshipStatus = user.relationshipStatus;
    publicProfile.website = user.website;
    publicProfile.workingAt = user.workingAt;
    publicProfile.school = user.school;

    res.json({ profile: publicProfile });
  } catch (error) {
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
