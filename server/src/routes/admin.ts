import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import {
  getAdminAnalytics,
  getAdminOverview,
  getAdminWallet,
  getAdminTransactions,
  getAllWallets,
  getAllTransactions,
} from "../controllers/admin.controller";
import { batchAdminUsers, listAdminUsers, updateAdminUser, getAdminUserProfile, updateAdminUserProfile } from "../controllers/admin-users.controller";
import { getAdminRolesSummary } from "../controllers/admin-roles.controller";
import { getAdminTopFollowed } from "../controllers/admin-social.controller";
import { getAdminSettings, updateAdminSettings } from "../controllers/admin-settings.controller";

import {
  adminDeleteComment,
  adminDeleteMedia,
  adminDeletePost,
  adminDeleteStory,
  adminRestoreComment,
  adminRestoreMedia,
  adminRestorePost,
  adminRestoreStory,
  listAdminComments,
  listAdminMedia,
  listAdminPosts,
  listAdminStories,
} from "../controllers/admin-content.controller";
import {
  adminMarketplaceConstants,
  adminMarketplaceDeleteListing,
  adminMarketplaceRestoreListing,
  adminMarketplaceSetListingFeatured,
  adminMarketplaceSetListingStatus,
  adminMarketplaceUpdateOrder,
  listAdminMarketplaceListings,
  listAdminMarketplaceOrders,
} from "../controllers/admin-marketplace.controller";
import {
  adminCancelFeaturedRoom,
  adminDeleteCommunity,
  adminDeleteCommunityMessage,
  adminDeleteRoom,
  adminDeleteRoomMessage,
  adminExpireFeaturedRoom,
  adminRemoveCommunityMember,
  adminRemoveRoomMember,
  adminRestoreCommunity,
  adminRestoreCommunityMessage,
  adminRestoreRoom,
  adminRestoreRoomMessage,
  adminSetCommunityMemberRole,
  adminSetRoomMemberRole,
  adminSetRoomMemberStatus,
  listAdminCommunities,
  listAdminCommunityMembers,
  listAdminCommunityMessages,
  listAdminFeaturedRooms,
  listAdminRoomMembers,
  listAdminRoomMessages,
  listAdminRooms,
} from "../controllers/admin-community-room.controller";

export const adminRouter = Router();

adminRouter.get("/overview", requireAuth, requireAdmin, getAdminOverview);
adminRouter.get("/analytics", requireAuth, requireAdmin, getAdminAnalytics);

adminRouter.get("/users", requireAuth, requireAdmin, listAdminUsers);
adminRouter.patch("/users/:userId", requireAuth, requireAdmin, updateAdminUser);
adminRouter.post("/users/batch", requireAuth, requireAdmin, batchAdminUsers);
adminRouter.get("/users/:userId/profile", requireAuth, requireAdmin, getAdminUserProfile);
adminRouter.patch("/users/:userId/profile", requireAuth, requireAdmin, updateAdminUserProfile);

adminRouter.get("/roles/summary", requireAuth, requireAdmin, getAdminRolesSummary);

adminRouter.get("/content/posts", requireAuth, requireAdmin, listAdminPosts);
adminRouter.post("/content/posts/:postId/delete", requireAuth, requireAdmin, adminDeletePost);
adminRouter.post("/content/posts/:postId/restore", requireAuth, requireAdmin, adminRestorePost);

adminRouter.get("/content/comments", requireAuth, requireAdmin, listAdminComments);
adminRouter.post("/content/comments/:commentId/delete", requireAuth, requireAdmin, adminDeleteComment);
adminRouter.post("/content/comments/:commentId/restore", requireAuth, requireAdmin, adminRestoreComment);

adminRouter.get("/content/stories", requireAuth, requireAdmin, listAdminStories);
adminRouter.post("/content/stories/:storyId/delete", requireAuth, requireAdmin, adminDeleteStory);
adminRouter.post("/content/stories/:storyId/restore", requireAuth, requireAdmin, adminRestoreStory);

adminRouter.get("/content/media", requireAuth, requireAdmin, listAdminMedia);
adminRouter.post("/content/media/:mediaId/delete", requireAuth, requireAdmin, adminDeleteMedia);
adminRouter.post("/content/media/:mediaId/restore", requireAuth, requireAdmin, adminRestoreMedia);

adminRouter.get("/social/top-followed", requireAuth, requireAdmin, getAdminTopFollowed);

adminRouter.get("/marketplace/constants", requireAuth, requireAdmin, adminMarketplaceConstants);

adminRouter.get("/marketplace/listings", requireAuth, requireAdmin, listAdminMarketplaceListings);
adminRouter.patch(
  "/marketplace/listings/:productId/featured",
  requireAuth,
  requireAdmin,
  adminMarketplaceSetListingFeatured
);
adminRouter.patch(
  "/marketplace/listings/:productId/status",
  requireAuth,
  requireAdmin,
  adminMarketplaceSetListingStatus
);
adminRouter.post(
  "/marketplace/listings/:productId/delete",
  requireAuth,
  requireAdmin,
  adminMarketplaceDeleteListing
);
adminRouter.post(
  "/marketplace/listings/:productId/restore",
  requireAuth,
  requireAdmin,
  adminMarketplaceRestoreListing
);

adminRouter.get("/marketplace/orders", requireAuth, requireAdmin, listAdminMarketplaceOrders);
adminRouter.patch("/marketplace/orders/:orderId", requireAuth, requireAdmin, adminMarketplaceUpdateOrder);

adminRouter.get("/communities", requireAuth, requireAdmin, listAdminCommunities);
adminRouter.post("/communities/:communityId/delete", requireAuth, requireAdmin, adminDeleteCommunity);
adminRouter.post("/communities/:communityId/restore", requireAuth, requireAdmin, adminRestoreCommunity);

adminRouter.get("/communities/:communityId/members", requireAuth, requireAdmin, listAdminCommunityMembers);
adminRouter.patch(
  "/communities/:communityId/members/:memberId/role",
  requireAuth,
  requireAdmin,
  adminSetCommunityMemberRole
);
adminRouter.post(
  "/communities/:communityId/members/:memberId/remove",
  requireAuth,
  requireAdmin,
  adminRemoveCommunityMember
);

adminRouter.get("/communities/:communityId/messages", requireAuth, requireAdmin, listAdminCommunityMessages);
adminRouter.post(
  "/communities/:communityId/messages/:messageId/delete",
  requireAuth,
  requireAdmin,
  adminDeleteCommunityMessage
);
adminRouter.post(
  "/communities/:communityId/messages/:messageId/restore",
  requireAuth,
  requireAdmin,
  adminRestoreCommunityMessage
);

adminRouter.get("/rooms", requireAuth, requireAdmin, listAdminRooms);
adminRouter.post("/rooms/:roomId/delete", requireAuth, requireAdmin, adminDeleteRoom);
adminRouter.post("/rooms/:roomId/restore", requireAuth, requireAdmin, adminRestoreRoom);

adminRouter.get("/rooms/:roomId/members", requireAuth, requireAdmin, listAdminRoomMembers);
adminRouter.patch(
  "/rooms/:roomId/members/:memberId/role",
  requireAuth,
  requireAdmin,
  adminSetRoomMemberRole
);
adminRouter.patch(
  "/rooms/:roomId/members/:memberId/status",
  requireAuth,
  requireAdmin,
  adminSetRoomMemberStatus
);
adminRouter.post(
  "/rooms/:roomId/members/:memberId/remove",
  requireAuth,
  requireAdmin,
  adminRemoveRoomMember
);

adminRouter.get("/rooms/:roomId/messages", requireAuth, requireAdmin, listAdminRoomMessages);
adminRouter.post(
  "/rooms/:roomId/messages/:messageId/delete",
  requireAuth,
  requireAdmin,
  adminDeleteRoomMessage
);
adminRouter.post(
  "/rooms/:roomId/messages/:messageId/restore",
  requireAuth,
  requireAdmin,
  adminRestoreRoomMessage
);

adminRouter.get("/featured-rooms", requireAuth, requireAdmin, listAdminFeaturedRooms);
adminRouter.patch("/featured-rooms/:featuredId/cancel", requireAuth, requireAdmin, adminCancelFeaturedRoom);
adminRouter.patch("/featured-rooms/:featuredId/expire", requireAuth, requireAdmin, adminExpireFeaturedRoom);

// Settings routes
adminRouter.get("/settings", requireAuth, requireAdmin, getAdminSettings);
adminRouter.post("/settings", requireAuth, requireAdmin, updateAdminSettings);

// Wallet tracking routes
adminRouter.get("/wallet", requireAuth, requireAdmin, getAdminWallet);
adminRouter.get("/wallet/transactions", requireAuth, requireAdmin, getAdminTransactions);
adminRouter.get("/wallets", requireAuth, requireAdmin, getAllWallets);
adminRouter.get("/transactions", requireAuth, requireAdmin, getAllTransactions);

