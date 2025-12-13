import mongoose, { Schema } from "mongoose";

import {
  GroupMemberRole,
  GroupMemberStatus,
  type GroupMemberRole as GroupMemberRoleType,
  type GroupMemberStatus as GroupMemberStatusType,
} from "./common";
import type { ObjectId } from "./common";

export interface GroupMember {
  groupId: ObjectId;
  userId: ObjectId;
  role: GroupMemberRoleType;
  status: GroupMemberStatusType;
  deletedAt?: Date | null;
}

const GroupMemberSchema = new Schema<GroupMember>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: Object.values(GroupMemberRole),
      default: GroupMemberRole.member,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(GroupMemberStatus),
      default: GroupMemberStatus.approved,
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupMemberSchema.index({ groupId: 1, status: 1 });
GroupMemberSchema.index({ deletedAt: 1 });

export const GroupMemberModel =
  (mongoose.models.GroupMember as mongoose.Model<GroupMember>) ||
  mongoose.model<GroupMember>("GroupMember", GroupMemberSchema);
