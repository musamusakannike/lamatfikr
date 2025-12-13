import mongoose, { Schema } from "mongoose";

import { ObjectId, UserRole, type UserRole as UserRoleType } from "./common";

export interface User {
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  gender?: string;
  birthday?: Date;
  verified: boolean;
  role: UserRoleType;
  privacySettings?: Record<string, unknown>;
  lastActive?: Date;
  isBanned: boolean;
}

const UserSchema = new Schema<User>(
  {
    username: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    coverPhoto: { type: String },
    bio: { type: String, maxlength: 500 },
    gender: { type: String },
    birthday: { type: Date },
    verified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.user,
      required: true,
    },
    privacySettings: { type: Schema.Types.Mixed },
    lastActive: { type: Date },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

export const UserModel =
  (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema);

export type UserId = ObjectId;
