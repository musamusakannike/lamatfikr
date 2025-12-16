import mongoose, { Schema } from "mongoose";

import type { ObjectId } from "./common";

export const CommunityMemberRole = {
  owner: "owner",
  admin: "admin",
  member: "member",
} as const;
export type CommunityMemberRole = (typeof CommunityMemberRole)[keyof typeof CommunityMemberRole];

export interface CommunityMember {
  communityId: ObjectId;
  userId: ObjectId;
  role: CommunityMemberRole;
  lastReadAt?: Date;
  deletedAt?: Date | null;
}

const CommunityMemberSchema = new Schema<CommunityMember>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: Object.values(CommunityMemberRole),
      default: CommunityMemberRole.member,
      required: true,
    },
    lastReadAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMemberSchema.index({ deletedAt: 1 });

export const CommunityMemberModel =
  (mongoose.models.CommunityMember as mongoose.Model<CommunityMember>) ||
  mongoose.model<CommunityMember>("CommunityMember", CommunityMemberSchema);
