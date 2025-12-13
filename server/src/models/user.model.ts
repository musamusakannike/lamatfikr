import mongoose, { Schema } from "mongoose";

import { ObjectId, UserRole, type UserRole as UserRoleType, Gender, AuthProvider, PrivacyOption } from "./common";

export interface PrivacySettings {
  whoCanFollowMe: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanMessageMe: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyBirthday: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyEmail: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyPhone: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyLocation: typeof PrivacyOption[keyof typeof PrivacyOption];
}

export interface User {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  phone?: string;
  passwordHash?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  gender?: typeof Gender[keyof typeof Gender];
  birthday?: Date;
  relationshipStatus?: string;
  address?: string;
  website?: string;
  workingAt?: string;
  school?: string;
  verified: boolean;
  role: UserRoleType;
  privacySettings: PrivacySettings;
  lastActive?: Date;
  isBanned: boolean;
  authProvider: typeof AuthProvider[keyof typeof AuthProvider];
  firebaseUid?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PrivacySettingsSchema = new Schema<PrivacySettings>(
  {
    whoCanFollowMe: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanMessageMe: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyBirthday: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.friends,
    },
    whoCanSeeMyEmail: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.nobody,
    },
    whoCanSeeMyPhone: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.nobody,
    },
    whoCanSeeMyLocation: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.friends,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<User>(
  {
    firstName: { type: String, required: true, trim: true, minlength: 1 },
    lastName: { type: String, required: true, trim: true, minlength: 1 },
    username: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, trim: true, lowercase: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    avatar: { type: String },
    coverPhoto: { type: String },
    bio: { type: String, maxlength: 500 },
    gender: { type: String, enum: Object.values(Gender) },
    birthday: { type: Date },
    relationshipStatus: { type: String },
    address: { type: String },
    website: { type: String },
    workingAt: { type: String },
    school: { type: String },
    verified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.user,
      required: true,
    },
    privacySettings: {
      type: PrivacySettingsSchema,
      default: () => ({}),
    },
    lastActive: { type: Date },
    isBanned: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.email,
      required: true,
    },
    firebaseUid: { type: String, sparse: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

export const UserModel =
  (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema);

export type UserId = ObjectId;
