import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { UserModel } from "../models/user.model";
import { PostModel } from "../models/post.model";
import { PostPrivacy, FollowStatus, FriendshipStatus } from "../models/common";
import { BlockModel } from "../models/block.model";
import { FriendshipModel } from "../models/friendship.model";
import { FollowModel } from "../models/follow.model";

export const searchAll: RequestHandler = async (req, res, next) => {
  try {
    const q = (req.query.q as string)?.trim() || "";
    const limit = Math.min(parseInt((req.query.limit as string) || "5", 10), 20);
    const userId = req.userId;

    if (q.length < 2) {
      res.json({ users: [], posts: [] });
      return;
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // Users: match username, firstName, lastName
    const users = await UserModel.find({
      isBanned: false,
      $or: [{ username: regex }, { firstName: regex }, { lastName: regex }],
    })
      .select("firstName lastName username avatar verified")
      .limit(limit)
      .lean();

    // Posts: public posts matching contentText; include viewer's own posts
    const postQuery: any = {
      deletedAt: null,
      $and: [{ $or: [{ contentText: regex }] }],
    };

    // Privacy filtering
    if (userId) {
      const [friendships, following, blockedPairs] = await Promise.all([
        FriendshipModel.find({
          $or: [
            { requesterId: userId, status: FriendshipStatus.accepted },
            { addresseeId: userId, status: FriendshipStatus.accepted },
          ],
        }).lean(),
        FollowModel.find({ followerId: userId, status: FollowStatus.accepted }).lean(),
        BlockModel.find({ $or: [{ blockerId: userId }, { blockedId: userId }] }).lean(),
      ]);

      const friendIds = friendships.map((f) =>
        f.requesterId.toString() === userId ? f.addresseeId.toString() : f.requesterId.toString()
      );
      const followingIds = following.map((f) => f.followingId.toString());
      const blockedIds = blockedPairs.map((b) =>
        b.blockerId.toString() === userId ? b.blockedId.toString() : b.blockerId.toString()
      );

      postQuery.userId = { $nin: blockedIds.map((id) => new Types.ObjectId(id)) };
      postQuery.$or = [
        { userId },
        { privacy: PostPrivacy.public },
        {
          privacy: { $in: [PostPrivacy.friends, PostPrivacy.friends_only] },
          userId: { $in: friendIds.map((id) => new Types.ObjectId(id)) },
        },
        {
          privacy: PostPrivacy.followers,
          userId: { $in: followingIds.map((id) => new Types.ObjectId(id)) },
        },
      ];
    } else {
      postQuery.privacy = PostPrivacy.public;
    }

    const posts = await PostModel.find(postQuery)
      .select("contentText userId privacy createdAt upvoteCount downvoteCount")
      .populate("userId", "firstName lastName username avatar verified paidVerifiedUntil")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ users, posts });
  } catch (err) {
    next(err);
  }
};
