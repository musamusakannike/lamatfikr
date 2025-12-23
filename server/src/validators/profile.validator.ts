import { z } from "zod";
import { Gender, PrivacyOption } from "../models/common";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  gender: z.enum([Gender.male, Gender.female, Gender.other, Gender.preferNotToSay]).optional(),
  birthday: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  relationshipStatus: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  nationality: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  website: z.string().url().max(200).optional().or(z.literal("")),
  workingAt: z.string().max(100).optional(),
  school: z.string().max(100).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  languagesSpoken: z.array(z.string().max(50)).max(20).optional(),
  phone: z.string().max(20).optional(),
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.array(z.number()).length(2),
    })
    .optional(),
});

export const updateAvatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
});

export const updateCoverPhotoSchema = z.object({
  coverPhotoUrl: z.string().url("Invalid cover photo URL"),
});

export const updatePrivacySettingsSchema = z.object({
  whoCanFollowMe: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanMessageMe: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyBirthday: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyEmail: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyPhone: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyLocation: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyGender: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyNationality: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyCity: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyOccupation: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyRelationshipStatus: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyWorkingAt: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMySchool: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyWebsite: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyInterests: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
  whoCanSeeMyLanguages: z.enum([PrivacyOption.everyone, PrivacyOption.friends, PrivacyOption.nobody]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
export type UpdateCoverPhotoInput = z.infer<typeof updateCoverPhotoSchema>;
export type UpdatePrivacySettingsInput = z.infer<typeof updatePrivacySettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
