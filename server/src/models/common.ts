import { Types } from "mongoose";

export type ObjectId = Types.ObjectId;

export const UserRole = {
  user: "user",
  admin: "admin",
  moderator: "moderator",
  superadmin: "superadmin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const FollowStatus = {
  pending: "pending",
  accepted: "accepted",
  blocked: "blocked",
} as const;
export type FollowStatus = (typeof FollowStatus)[keyof typeof FollowStatus];

export const PostPrivacy = {
  public: "public",
  followers: "followers",
  friends: "friends",
  friends_only: "friends_only",
  me_only: "me_only",
} as const;
export type PostPrivacy = (typeof PostPrivacy)[keyof typeof PostPrivacy];

export const ConversationType = {
  private: "private",
  group: "group",
} as const;
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];

export const ReactionTargetType = {
  post: "post",
  comment: "comment",
} as const;
export type ReactionTargetType = (typeof ReactionTargetType)[keyof typeof ReactionTargetType];

export const PageFollowerRole = {
  admin: "admin",
  editor: "editor",
  follower: "follower",
} as const;
export type PageFollowerRole = (typeof PageFollowerRole)[keyof typeof PageFollowerRole];

export const GroupPrivacy = {
  public: "public",
  private: "private",
  secret: "secret",
} as const;
export type GroupPrivacy = (typeof GroupPrivacy)[keyof typeof GroupPrivacy];

export const GroupMemberRole = {
  admin: "admin",
  moderator: "moderator",
  member: "member",
} as const;
export type GroupMemberRole = (typeof GroupMemberRole)[keyof typeof GroupMemberRole];

export const GroupMemberStatus = {
  pending: "pending",
  approved: "approved",
} as const;
export type GroupMemberStatus = (typeof GroupMemberStatus)[keyof typeof GroupMemberStatus];

export const NotificationType = {
  like: "like",
  comment: "comment",
  follow: "follow",
  mention: "mention",
  share: "share",
  friend_request: "friend_request",
  friend_accept: "friend_accept",
  verification_request_submitted: "verification_request_submitted",
  verification_request_approved: "verification_request_approved",
  verification_request_rejected: "verification_request_rejected",
  marketplace_order_paid_buyer: "marketplace_order_paid_buyer",
  marketplace_order_paid_seller: "marketplace_order_paid_seller",
  blocked_by_user: "blocked_by_user",
  room_livestream_started: "room_livestream_started",
  room_video_call_started: "room_video_call_started",
  room_space_started: "room_space_started",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const AdStatus = {
  draft: "draft",
  active: "active",
  paused: "paused",
  completed: "completed",
} as const;
export type AdStatus = (typeof AdStatus)[keyof typeof AdStatus];

export const AdEventType = {
  view: "view",
  click: "click",
} as const;
export type AdEventType = (typeof AdEventType)[keyof typeof AdEventType];

export const ReportStatus = {
  open: "open",
  reviewing: "reviewing",
  resolved: "resolved",
  rejected: "rejected",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const SubscriptionStatus = {
  active: "active",
  canceled: "canceled",
  expired: "expired",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PostMediaType = {
  image: "image",
  video: "video",
  audio: "audio",
  voice_note: "voice_note",
  file: "file",
} as const;
export type PostMediaType = (typeof PostMediaType)[keyof typeof PostMediaType];

export const FriendshipStatus = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
} as const;
export type FriendshipStatus = (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

export const VoteType = {
  upvote: "upvote",
  downvote: "downvote",
} as const;
export type VoteType = (typeof VoteType)[keyof typeof VoteType];

export const SavedItemType = {
  post: "post",
  comment: "comment",
} as const;
export type SavedItemType = (typeof SavedItemType)[keyof typeof SavedItemType];

export const Gender = {
  male: "male",
  female: "female",
  other: "other",
  preferNotToSay: "prefer_not_to_say",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const AuthProvider = {
  email: "email",
  google: "google",
  facebook: "facebook",
  apple: "apple",
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const PrivacyOption = {
  everyone: "everyone",
  friends: "friends",
  nobody: "nobody",
} as const;
export type PrivacyOption = (typeof PrivacyOption)[keyof typeof PrivacyOption];

export const VerificationStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const DocumentType = {
  passport: "passport",
  nationalId: "national_id",
  driversLicense: "drivers_license",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
