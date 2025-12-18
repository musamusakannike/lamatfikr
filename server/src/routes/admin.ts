import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { getAdminAnalytics, getAdminOverview } from "../controllers/admin.controller";
import { batchAdminUsers, listAdminUsers, updateAdminUser } from "../controllers/admin-users.controller";
import { getAdminRolesSummary } from "../controllers/admin-roles.controller";
import { getAdminTopFollowed } from "../controllers/admin-social.controller";
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

export const adminRouter = Router();

adminRouter.get("/overview", requireAuth, requireAdmin, getAdminOverview);
adminRouter.get("/analytics", requireAuth, requireAdmin, getAdminAnalytics);

adminRouter.get("/users", requireAuth, requireAdmin, listAdminUsers);
adminRouter.patch("/users/:userId", requireAuth, requireAdmin, updateAdminUser);
adminRouter.post("/users/batch", requireAuth, requireAdmin, batchAdminUsers);

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
