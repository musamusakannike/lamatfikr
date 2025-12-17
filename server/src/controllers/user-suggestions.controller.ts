import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { UserModel } from "../models/user.model";
import { FollowModel } from "../models/follow.model";
import { FriendshipModel } from "../models/friendship.model";
import { BlockModel } from "../models/block.model";
import { PostModel } from "../models/post.model";
import { RoomMemberModel } from "../models/room-member.model";
import { CommunityMemberModel } from "../models/community-member.model";
import { FollowStatus, FriendshipStatus } from "../models/common";

export const getSuggestedUsers: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const userObjectId = new Types.ObjectId(userId);

    const [
      usersIFollow,
      usersWhoBlockedMe,
      usersIBlocked,
      myRooms,
      myCommunities,
    ] = await Promise.all([
      FollowModel.find({
        followerId: userObjectId,
        status: FollowStatus.accepted,
      }).distinct("followingId"),
      BlockModel.find({ blockedId: userObjectId }).distinct("blockerId"),
      BlockModel.find({ blockerId: userObjectId }).distinct("blockedId"),
      RoomMemberModel.find({ userId: userObjectId }).distinct("roomId"),
      CommunityMemberModel.find({ userId: userObjectId }).distinct("communityId"),
    ]);

    const excludedUserIds = [
      userObjectId,
      ...usersIFollow,
      ...usersWhoBlockedMe,
      ...usersIBlocked,
    ];

    const followersOfMyFollowingRaw = await FollowModel.find({
      followerId: { $in: usersIFollow },
      status: FollowStatus.accepted,
      followingId: { $nin: excludedUserIds },
    }).distinct("followingId");
    
    const followersOfMyFollowing = followersOfMyFollowingRaw.slice(0, 50);

    const usersInMyRoomsRaw = await RoomMemberModel.find({
      roomId: { $in: myRooms },
      userId: { $nin: excludedUserIds },
    }).distinct("userId");
    
    const usersInMyRooms = usersInMyRoomsRaw.slice(0, 50);

    const usersInMyCommunitiesRaw = await CommunityMemberModel.find({
      communityId: { $in: myCommunities },
      userId: { $nin: excludedUserIds },
    }).distinct("userId");
    
    const usersInMyCommunities = usersInMyCommunitiesRaw.slice(0, 50);

    const usersWhoLikedMyPosts = await PostModel.aggregate([
      { $match: { authorId: userObjectId } },
      { $unwind: "$likes" },
      {
        $match: {
          likes: { $nin: excludedUserIds },
        },
      },
      { $group: { _id: "$likes" } },
      { $limit: 50 },
    ]);

    const likedUserIds = usersWhoLikedMyPosts.map((doc) => doc._id);

    const scoredUsers = new Map<string, number>();

    followersOfMyFollowing.forEach((id) => {
      const key = id.toString();
      scoredUsers.set(key, (scoredUsers.get(key) || 0) + 3);
    });

    usersInMyRooms.forEach((id) => {
      const key = id.toString();
      scoredUsers.set(key, (scoredUsers.get(key) || 0) + 2);
    });

    usersInMyCommunities.forEach((id) => {
      const key = id.toString();
      scoredUsers.set(key, (scoredUsers.get(key) || 0) + 2);
    });

    likedUserIds.forEach((id) => {
      const key = id.toString();
      scoredUsers.set(key, (scoredUsers.get(key) || 0) + 1);
    });

    const sortedUserIds = Array.from(scoredUsers.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => new Types.ObjectId(id));

    const suggestedUserIds = sortedUserIds.slice(skip, skip + limit);

    if (suggestedUserIds.length < limit) {
      const remainingLimit = limit - suggestedUserIds.length;
      const randomUsers = await UserModel.find({
        _id: {
          $nin: [...excludedUserIds, ...suggestedUserIds],
        },
        isBanned: false,
      })
        .select("_id")
        .limit(remainingLimit)
        .lean();

      suggestedUserIds.push(...randomUsers.map((u) => u._id));
    }

    const suggestedUsers = await UserModel.find({
      _id: { $in: suggestedUserIds },
    })
      .select("firstName lastName username avatar verified bio")
      .lean();

    const userFollowerCounts = await FollowModel.aggregate([
      {
        $match: {
          followingId: { $in: suggestedUserIds },
          status: FollowStatus.accepted,
        },
      },
      {
        $group: {
          _id: "$followingId",
          count: { $sum: 1 },
        },
      },
    ]);

    const followerCountMap = new Map(
      userFollowerCounts.map((item) => [item._id.toString(), item.count])
    );

    const usersWithMetadata = suggestedUsers.map((user) => ({
      ...user,
      followersCount: followerCountMap.get(user._id.toString()) || 0,
      suggestionScore: scoredUsers.get(user._id.toString()) || 0,
    }));

    usersWithMetadata.sort((a, b) => {
      if (b.suggestionScore !== a.suggestionScore) {
        return b.suggestionScore - a.suggestionScore;
      }
      return b.followersCount - a.followersCount;
    });

    res.json({
      users: usersWithMetadata,
      pagination: {
        page,
        limit,
        total: sortedUserIds.length,
        pages: Math.ceil(sortedUserIds.length / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMutualConnections: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { targetUserId } = req.params;

    if (!targetUserId) {
      res.status(400).json({ message: "Target user ID is required" });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);
    const targetUserObjectId = new Types.ObjectId(targetUserId);

    const [myFollowing, targetFollowing, myFriends, targetFriends] = await Promise.all([
      FollowModel.find({
        followerId: userObjectId,
        status: FollowStatus.accepted,
      }).distinct("followingId"),
      FollowModel.find({
        followerId: targetUserObjectId,
        status: FollowStatus.accepted,
      }).distinct("followingId"),
      FriendshipModel.find({
        $or: [
          { requesterId: userObjectId, status: FriendshipStatus.accepted },
          { addresseeId: userObjectId, status: FriendshipStatus.accepted },
        ],
      }).lean(),
      FriendshipModel.find({
        $or: [
          { requesterId: targetUserObjectId, status: FriendshipStatus.accepted },
          { addresseeId: targetUserObjectId, status: FriendshipStatus.accepted },
        ],
      }).lean(),
    ]);

    const myFriendIds = myFriends.map((f) =>
      f.requesterId.toString() === userId ? f.addresseeId.toString() : f.requesterId.toString()
    );

    const targetFriendIds = targetFriends.map((f) =>
      f.requesterId.toString() === targetUserId
        ? f.addresseeId.toString()
        : f.requesterId.toString()
    );

    const mutualFollowing = myFollowing.filter((id) =>
      targetFollowing.some((tid) => tid.toString() === id.toString())
    );

    const mutualFriends = myFriendIds.filter((id) => targetFriendIds.includes(id));

    const allMutualIds = [
      ...new Set([
        ...mutualFollowing.map((id) => id.toString()),
        ...mutualFriends,
      ]),
    ].map((id) => new Types.ObjectId(id));

    const mutualUsers = await UserModel.find({
      _id: { $in: allMutualIds },
    })
      .select("firstName lastName username avatar verified")
      .limit(10)
      .lean();

    res.json({
      mutualConnections: mutualUsers,
      count: allMutualIds.length,
    });
  } catch (error) {
    next(error);
  }
};
