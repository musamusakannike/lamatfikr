import mongoose, { Schema } from "mongoose";

import { ObjectId, UserRole, type UserRole as UserRoleType, Gender, AuthProvider, PrivacyOption } from "./common";

export interface PrivacySettings {
  whoCanFollowMe: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanMessageMe: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyBirthday: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyEmail: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyPhone: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyLocation: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyGender: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyNationality: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyCity: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyOccupation: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyRelationshipStatus: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyWorkingAt: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMySchool: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyWebsite: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyInterests: typeof PrivacyOption[keyof typeof PrivacyOption];
  whoCanSeeMyLanguages: typeof PrivacyOption[keyof typeof PrivacyOption];
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
  nationality?: string;
  city?: string;
  occupation?: string;
  website?: string;
  workingAt?: string;
  school?: string;
  interests?: string[];
  languagesSpoken?: string[];
  verified: boolean;
  paidVerifiedUntil?: Date;
  paidVerifiedPurchasedAt?: Date;
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
  location?: {
    type: "Point";
    coordinates: number[];
  };
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
    whoCanSeeMyGender: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyNationality: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyCity: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyOccupation: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyRelationshipStatus: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.friends,
    },
    whoCanSeeMyWorkingAt: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMySchool: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyWebsite: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyInterests: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
    },
    whoCanSeeMyLanguages: {
      type: String,
      enum: Object.values(PrivacyOption),
      default: PrivacyOption.everyone,
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
    nationality: { type: String, maxlength: 100 },
    city: { type: String, maxlength: 100 },
    occupation: { type: String, maxlength: 100 },
    website: { type: String },
    workingAt: { type: String },
    school: { type: String },
    interests: { type: [String], default: [] },
    languagesSpoken: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    paidVerifiedUntil: { type: Date },
    paidVerifiedPurchasedAt: { type: Date },
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
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });
UserSchema.index({ location: "2dsphere" });

export const UserModel =
  (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema);

export type UserId = ObjectId;
