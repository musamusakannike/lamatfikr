import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { PostModel } from "../models/post.model";
import { PostMediaModel } from "../models/post-media.model";
import { VoteModel } from "../models/vote.model";
import { SavedItemModel } from "../models/saved-item.model";
import { HashtagModel } from "../models/hashtag.model";
import { PostHashtagModel } from "../models/post-hashtag.model";
import { MentionModel } from "../models/mention.model";
import { PollModel } from "../models/poll.model";
import { PollVoteModel } from "../models/poll-vote.model";
import { UserModel } from "../models/user.model";
import { FriendshipModel } from "../models/friendship.model";
import { FollowModel } from "../models/follow.model";
import { BlockModel } from "../models/block.model";
import { MuteModel } from "../models/mute.model";
import {
  PostPrivacy,
  VoteType,
  SavedItemType,
  FriendshipStatus,
  FollowStatus,
  NotificationType,
} from "../models/common";
import { createNotification } from "../services/notification";
import { parseContent } from "../utils/content-parser";
import {
  createPostSchema,
  updatePostSchema,
  votePostSchema,
  votePollSchema,
} from "../validators/post.validator";

// ==================== HELPERS ====================

async function processHashtagsAndMentions(postId: Types.ObjectId, contentText: string | undefined) {
  const { hashtags, mentions } = parseContent(contentText);

  if (hashtags.length > 0) {
    const hashtagDocs = await Promise.all(
      hashtags.map(async (tag) => {
        const hashtag = await HashtagModel.findOneAndUpdate(
          { tag },
          { $inc: { postCount: 1 }, $set: { lastUsedAt: new Date() } },
          { upsert: true, new: true }
        );
        return hashtag;
      })
    );

    await PostHashtagModel.insertMany(
      hashtagDocs.map((h) => ({ postId, hashtagId: h._id })),
      { ordered: false }
    ).catch(() => { });
  }

  if (mentions.length > 0) {
    const mentionedUsers = await UserModel.find({
      username: { $in: mentions },
    }).select("_id");

    if (mentionedUsers.length > 0) {
      await MentionModel.insertMany(
        mentionedUsers.map((u) => ({ postId, mentionedUserId: u._id })),
        { ordered: false }
      ).catch(() => { });
    }
  }
}

async function canViewPost(viewerId: string | undefined, post: any): Promise<boolean> {
  if (!post) return false;

  const postUserId = post.userId.toString();

  if (viewerId === postUserId) return true;

  if (post.privacy === PostPrivacy.me_only) return false;

  if (post.privacy === PostPrivacy.public) return true;

  if (!viewerId) return false;

  const isBlocked = await BlockModel.findOne({
    $or: [
      { blockerId: viewerId, blockedId: postUserId },
      { blockerId: postUserId, blockedId: viewerId },
    ],
  });
  if (isBlocked) return false;

  if (post.privacy === PostPrivacy.friends || post.privacy === PostPrivacy.friends_only) {
    const friendship = await FriendshipModel.findOne({
      $or: [
        { requesterId: viewerId, addresseeId: postUserId, status: FriendshipStatus.accepted },
        { requesterId: postUserId, addresseeId: viewerId, status: FriendshipStatus.accepted },
      ],
    });
    return !!friendship;
  }

  if (post.privacy === PostPrivacy.followers) {
    const follow = await FollowModel.findOne({
      followerId: viewerId,
      followingId: postUserId,
      status: FollowStatus.accepted,
    });
    return !!follow;
  }

  return false;
}

// ==================== POST CRUD ====================

export const createPost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validation = createPostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { contentText, privacy, location, feeling, media, poll } = validation.data;

    const post = await PostModel.create({
      userId,
      contentText,
      privacy,
      location,
      feeling,
      hasPoll: !!poll,
    });

    if (media && media.length > 0) {
      await PostMediaModel.insertMany(
        media.map((m) => ({
          postId: post._id,
          type: m.type,
          url: m.url,
          thumbnail: m.thumbnail,
          size: m.size,
          duration: m.duration,
        }))
      );
    }

    if (poll) {
      await PollModel.create({
        postId: post._id,
        question: poll.question,
        options: poll.options.map((text) => ({ text, voteCount: 0 })),
        allowMultipleVotes: poll.allowMultipleVotes,
        endsAt: poll.endsAt ? new Date(poll.endsAt) : undefined,
      });
    }

    await processHashtagsAndMentions(post._id as Types.ObjectId, contentText);

    if (contentText) {
      const { mentions } = parseContent(contentText);
      if (mentions.length > 0) {
        const mentionedUsers = await UserModel.find({ username: { $in: mentions } })
          .select("_id")
          .lean();

        await Promise.all(
          mentionedUsers.map((u) =>
            createNotification({
              userId: u._id.toString(),
              actorId: userId,
              type: NotificationType.mention,
              targetId: post._id.toString(),
              url: `/posts/${post._id.toString()}`,
            })
          )
        );
      }
    }

    const populatedPost = await PostModel.findById(post._id)
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    const postMedia = await PostMediaModel.find({ postId: post._id, deletedAt: null }).lean();
    const postPoll = poll ? await PollModel.findOne({ postId: post._id }).lean() : null;

    res.status(201).json({
      message: "Post created successfully",
      post: {
        ...populatedPost,
        media: postMedia,
        poll: postPoll,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPost: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const viewerId = req.userId;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null })
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(viewerId, post);
    if (!canView) {
      res.status(403).json({ message: "You do not have permission to view this post" });
      return;
    }

    const [media, poll, userVote] = await Promise.all([
      PostMediaModel.find({ postId, deletedAt: null }).lean(),
      post.hasPoll ? PollModel.findOne({ postId }).lean() : null,
      viewerId ? VoteModel.findOne({ userId: viewerId, postId }).lean() : null,
    ]);

    let userPollVotes: string[] = [];
    if (poll && viewerId) {
      const pollVotes = await PollVoteModel.find({ pollId: poll._id, userId: viewerId }).lean();
      userPollVotes = pollVotes.map((v) => v.optionId.toString());
    }

    res.json({
      post: {
        ...post,
        upvotes: post.upvoteCount,
        downvotes: post.downvoteCount,
        media,
        poll: poll ? { ...poll, userVotes: userPollVotes } : null,
        userVote: userVote?.voteType || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const validation = updatePostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.userId.toString() !== userId) {
      res.status(403).json({ message: "You can only edit your own posts" });
      return;
    }

    const { contentText, privacy, location, feeling } = validation.data;

    if (contentText !== undefined) post.contentText = contentText;
    if (privacy !== undefined) post.privacy = privacy;
    if (location !== undefined) post.location = location || undefined;
    if (feeling !== undefined) post.feeling = feeling || undefined;
    post.isEdited = true;

    await post.save();

    if (contentText !== undefined) {
      await PostHashtagModel.deleteMany({ postId });
      await MentionModel.deleteMany({ postId });
      await processHashtagsAndMentions(post._id as Types.ObjectId, contentText);
    }

    res.json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.userId.toString() !== userId) {
      res.status(403).json({ message: "You can only delete your own posts" });
      return;
    }

    post.deletedAt = new Date();
    await post.save();

    await PostMediaModel.updateMany({ postId }, { deletedAt: new Date() });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ==================== FEED ====================

export const getFeed: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const now = Date.now();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [friendships, following, blocked, muted] = await Promise.all([
      FriendshipModel.find({
        $or: [
          { requesterId: userId, status: FriendshipStatus.accepted },
          { addresseeId: userId, status: FriendshipStatus.accepted },
        ],
      }).lean(),
      FollowModel.find({ followerId: userId, status: FollowStatus.accepted }).lean(),
      BlockModel.find({
        $or: [{ blockerId: userId }, { blockedId: userId }],
      }).lean(),
      MuteModel.find({
        muterId: userId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).lean(),
    ]);

    const friendIds = friendships.map((f) =>
      f.requesterId.toString() === userId ? f.addresseeId.toString() : f.requesterId.toString()
    );
    const followingIds = following.map((f) => f.followingId.toString());
    const blockedIds = blocked.map((b) =>
      b.blockerId.toString() === userId ? b.blockedId.toString() : b.blockerId.toString()
    );
    const mutedIds = muted.map((m) => m.mutedId.toString());

    const excludeIds = [...new Set([...blockedIds, ...mutedIds])];

    const posts = await PostModel.find({
      deletedAt: null,
      userId: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) },
      $or: [
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
      ],
    })
      .populate("userId", "firstName lastName username avatar verified paidVerifiedUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = posts.map((p) => p._id);

    const [allMedia, allPolls, userVotes] = await Promise.all([
      PostMediaModel.find({ postId: { $in: postIds }, deletedAt: null }).lean(),
      PollModel.find({ postId: { $in: postIds } }).lean(),
      VoteModel.find({ userId, postId: { $in: postIds } }).lean(),
    ]);

    const mediaByPost = new Map<string, any[]>();
    allMedia.forEach((m) => {
      const key = m.postId.toString();
      if (!mediaByPost.has(key)) mediaByPost.set(key, []);
      mediaByPost.get(key)!.push(m);
    });

    const pollByPost = new Map<string, any>();
    allPolls.forEach((p) => pollByPost.set(p.postId.toString(), p));

    const voteByPost = new Map<string, string>();
    userVotes.forEach((v) => voteByPost.set(v.postId.toString(), v.voteType));

    // Fetch user's poll votes
    const pollIds = allPolls.map((p) => p._id);
    const userPollVotes = pollIds.length > 0
      ? await PollVoteModel.find({ pollId: { $in: pollIds }, userId }).lean()
      : [];
    const pollVotesByPoll = new Map<string, string[]>();
    userPollVotes.forEach((v) => {
      const key = v.pollId.toString();
      if (!pollVotesByPoll.has(key)) pollVotesByPoll.set(key, []);
      pollVotesByPoll.get(key)!.push(v.optionId.toString());
    });

    const enrichedPosts = posts.map((post) => {
      const poll = pollByPost.get(post._id.toString());

      const populatedUser: any = post.userId;
      const paidUntil = populatedUser?.paidVerifiedUntil;
      const paidUntilMs = paidUntil ? new Date(paidUntil).getTime() : 0;
      const effectiveVerified = !!populatedUser?.verified || paidUntilMs > now;

      return {
        ...post,
        userId:
          populatedUser && typeof populatedUser === "object"
            ? { ...populatedUser, verified: effectiveVerified }
            : post.userId,
        upvotes: post.upvoteCount,
        downvotes: post.downvoteCount,
        media: mediaByPost.get(post._id.toString()) || [],
        poll: poll ? { ...poll, userVotes: pollVotesByPoll.get(poll._id.toString()) || [] } : null,
        userVote: voteByPost.get(post._id.toString()) || null,
      };
    });

    const total = await PostModel.countDocuments({
      deletedAt: null,
      userId: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) },
      $or: [
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
      ],
    });

    res.json({
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMediaPosts: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const now = Date.now();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [friendships, following, blocked, muted] = await Promise.all([
      FriendshipModel.find({
        $or: [
          { requesterId: userId, status: FriendshipStatus.accepted },
          { addresseeId: userId, status: FriendshipStatus.accepted },
        ],
      }).lean(),
      FollowModel.find({ followerId: userId, status: FollowStatus.accepted }).lean(),
      BlockModel.find({
        $or: [{ blockerId: userId }, { blockedId: userId }],
      }).lean(),
      MuteModel.find({
        muterId: userId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).lean(),
    ]);

    const friendIds = friendships.map((f) =>
      f.requesterId.toString() === userId ? f.addresseeId.toString() : f.requesterId.toString()
    );
    const followingIds = following.map((f) => f.followingId.toString());
    const blockedIds = blocked.map((b) =>
      b.blockerId.toString() === userId ? b.blockedId.toString() : b.blockerId.toString()
    );
    const mutedIds = muted.map((m) => m.mutedId.toString());

    const excludeIds = [...new Set([...blockedIds, ...mutedIds])];

    // First, get all media posts
    const mediaPostIds = await PostMediaModel.find({
      deletedAt: null,
      type: { $in: ["image", "video"] },
    })
      .distinct("postId")
      .lean();

    const posts = await PostModel.find({
      _id: { $in: mediaPostIds },
      deletedAt: null,
      userId: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) },
      $or: [
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
      ],
    })
      .populate("userId", "firstName lastName username avatar verified paidVerifiedUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = posts.map((p) => p._id);

    const [allMedia, allPolls, userVotes] = await Promise.all([
      PostMediaModel.find({ postId: { $in: postIds }, deletedAt: null }).lean(),
      PollModel.find({ postId: { $in: postIds } }).lean(),
      VoteModel.find({ userId, postId: { $in: postIds } }).lean(),
    ]);

    const mediaByPost = new Map<string, any[]>();
    allMedia.forEach((m) => {
      const key = m.postId.toString();
      if (!mediaByPost.has(key)) mediaByPost.set(key, []);
      mediaByPost.get(key)!.push(m);
    });

    const pollByPost = new Map<string, any>();
    allPolls.forEach((p) => pollByPost.set(p.postId.toString(), p));

    const voteByPost = new Map<string, string>();
    userVotes.forEach((v) => voteByPost.set(v.postId.toString(), v.voteType));

    // Fetch user's poll votes
    const pollIds = allPolls.map((p) => p._id);
    const userPollVotes = pollIds.length > 0
      ? await PollVoteModel.find({ pollId: { $in: pollIds }, userId }).lean()
      : [];
    const pollVotesByPoll = new Map<string, string[]>();
    userPollVotes.forEach((v) => {
      const key = v.pollId.toString();
      if (!pollVotesByPoll.has(key)) pollVotesByPoll.set(key, []);
      pollVotesByPoll.get(key)!.push(v.optionId.toString());
    });

    const enrichedPosts = posts.map((post) => {
      const poll = pollByPost.get(post._id.toString());

      const populatedUser: any = post.userId;
      const paidUntil = populatedUser?.paidVerifiedUntil;
      const paidUntilMs = paidUntil ? new Date(paidUntil).getTime() : 0;
      const effectiveVerified = !!populatedUser?.verified || paidUntilMs > now;

      return {
        ...post,
        userId:
          populatedUser && typeof populatedUser === "object"
            ? { ...populatedUser, verified: effectiveVerified }
            : post.userId,
        upvotes: post.upvoteCount,
        downvotes: post.downvoteCount,
        media: mediaByPost.get(post._id.toString()) || [],
        poll: poll ? { ...poll, userVotes: pollVotesByPoll.get(poll._id.toString()) || [] } : null,
        userVote: voteByPost.get(post._id.toString()) || null,
      };
    });

    const total = await PostModel.countDocuments({
      _id: { $in: mediaPostIds },
      deletedAt: null,
      userId: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) },
      $or: [
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
      ],
    });

    res.json({
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts: RequestHandler = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const viewerId = req.userId;

    const now = Date.now();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let privacyFilter: any = { privacy: PostPrivacy.public };

    if (viewerId) {
      if (viewerId === targetUserId) {
        privacyFilter = {};
      } else {
        const isBlocked = await BlockModel.findOne({
          $or: [
            { blockerId: viewerId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: viewerId },
          ],
        });

        if (isBlocked) {
          res.status(403).json({ message: "Cannot view this user's posts" });
          return;
        }

        const isFriend = await FriendshipModel.findOne({
          $or: [
            { requesterId: viewerId, addresseeId: targetUserId, status: FriendshipStatus.accepted },
            { requesterId: targetUserId, addresseeId: viewerId, status: FriendshipStatus.accepted },
          ],
        });

        const isFollowing = await FollowModel.findOne({
          followerId: viewerId,
          followingId: targetUserId,
          status: FollowStatus.accepted,
        });

        const allowedPrivacies: string[] = [PostPrivacy.public];
        if (isFriend) {
          allowedPrivacies.push(PostPrivacy.friends, PostPrivacy.friends_only);
        }
        if (isFollowing) {
          allowedPrivacies.push(PostPrivacy.followers);
        }

        privacyFilter = { privacy: { $in: allowedPrivacies } };
      }
    }

    const posts = await PostModel.find({
      userId: targetUserId,
      deletedAt: null,
      ...privacyFilter,
    })
      .populate("userId", "firstName lastName username avatar verified paidVerifiedUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postsWithEffectiveVerified = posts.map((post: any) => {
      const populatedUser: any = post.userId;
      const paidUntil = populatedUser?.paidVerifiedUntil;
      const paidUntilMs = paidUntil ? new Date(paidUntil).getTime() : 0;
      const effectiveVerified = !!populatedUser?.verified || paidUntilMs > now;

      return {
        ...post,
        userId:
          populatedUser && typeof populatedUser === "object"
            ? { ...populatedUser, verified: effectiveVerified }
            : post.userId,
      };
    });

    const postIds = postsWithEffectiveVerified.map((p) => p._id);

    const [allMedia, allPolls, userVotes] = await Promise.all([
      PostMediaModel.find({ postId: { $in: postIds }, deletedAt: null }).lean(),
      PollModel.find({ postId: { $in: postIds } }).lean(),
      viewerId ? VoteModel.find({ userId: viewerId, postId: { $in: postIds } }).lean() : [],
    ]);

    const mediaByPost = new Map<string, any[]>();
    allMedia.forEach((m) => {
      const key = m.postId.toString();
      if (!mediaByPost.has(key)) mediaByPost.set(key, []);
      mediaByPost.get(key)!.push(m);
    });

    const pollByPost = new Map<string, any>();
    allPolls.forEach((p) => pollByPost.set(p.postId.toString(), p));

    const voteByPost = new Map<string, string>();
    userVotes.forEach((v) => voteByPost.set(v.postId.toString(), v.voteType));

    // Fetch user's poll votes
    const pollIds = allPolls.map((p) => p._id);
    const userPollVotes = pollIds.length > 0 && viewerId
      ? await PollVoteModel.find({ pollId: { $in: pollIds }, userId: viewerId }).lean()
      : [];
    const pollVotesByPoll = new Map<string, string[]>();
    userPollVotes.forEach((v) => {
      const key = v.pollId.toString();
      if (!pollVotesByPoll.has(key)) pollVotesByPoll.set(key, []);
      pollVotesByPoll.get(key)!.push(v.optionId.toString());
    });

    const enrichedPosts = postsWithEffectiveVerified.map((post: any) => {
      const poll = pollByPost.get(post._id.toString());
      return {
        ...post,
        upvotes: post.upvoteCount,
        downvotes: post.downvoteCount,
        media: mediaByPost.get(post._id.toString()) || [],
        poll: poll ? { ...poll, userVotes: pollVotesByPoll.get(poll._id.toString()) || [] } : null,
        userVote: voteByPost.get(post._id.toString()) || null,
      };
    });

    const total = await PostModel.countDocuments({
      userId: targetUserId,
      deletedAt: null,
      ...privacyFilter,
    });

    res.json({
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VOTING ====================

export const votePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const validation = votePostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { voteType } = validation.data;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(userId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot vote on this post" });
      return;
    }

    const existingVote = await VoteModel.findOne({ userId, postId });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await existingVote.deleteOne();
        if (voteType === VoteType.upvote) {
          post.upvoteCount = Math.max(0, post.upvoteCount - 1);
        } else {
          post.downvoteCount = Math.max(0, post.downvoteCount - 1);
        }
        await post.save();

        res.json({ message: "Vote removed", userVote: null });
        return;
      } else {
        if (existingVote.voteType === VoteType.upvote) {
          post.upvoteCount = Math.max(0, post.upvoteCount - 1);
          post.downvoteCount += 1;
        } else {
          post.downvoteCount = Math.max(0, post.downvoteCount - 1);
          post.upvoteCount += 1;
        }
        existingVote.voteType = voteType;
        await Promise.all([existingVote.save(), post.save()]);

        if (voteType === VoteType.upvote) {
          const postOwnerId = post.userId?.toString?.() ?? post.userId;
          if (typeof postOwnerId === "string") {
            await createNotification({
              userId: postOwnerId,
              actorId: userId,
              type: NotificationType.like,
              targetId: postId,
              url: `/posts/${postId}`,
            });
          }
        }

        res.json({ message: "Vote changed", userVote: voteType });
        return;
      }
    }

    await VoteModel.create({ userId, postId, voteType });
    if (voteType === VoteType.upvote) {
      post.upvoteCount += 1;
    } else {
      post.downvoteCount += 1;
    }
    await post.save();

    if (voteType === VoteType.upvote) {
      const postOwnerId = post.userId?.toString?.() ?? post.userId;
      if (typeof postOwnerId === "string") {
        await createNotification({
          userId: postOwnerId,
          actorId: userId,
          type: NotificationType.like,
          targetId: postId,
          url: `/posts/${postId}`,
        });
      }
    }

    res.json({ message: "Vote recorded", userVote: voteType });
  } catch (error) {
    next(error);
  }
};

export const removeVote: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const vote = await VoteModel.findOneAndDelete({ userId, postId });
    if (!vote) {
      res.status(404).json({ message: "Vote not found" });
      return;
    }

    const post = await PostModel.findById(postId);
    if (post) {
      if (vote.voteType === VoteType.upvote) {
        post.upvoteCount = Math.max(0, post.upvoteCount - 1);
      } else {
        post.downvoteCount = Math.max(0, post.downvoteCount - 1);
      }
      await post.save();
    }

    res.json({ message: "Vote removed" });
  } catch (error) {
    next(error);
  }
};

// ==================== POLL VOTING ====================

export const votePoll: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const validation = votePollSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { optionIds } = validation.data;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post || !post.hasPoll) {
      res.status(404).json({ message: "Poll not found" });
      return;
    }

    const canView = await canViewPost(userId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot vote on this poll" });
      return;
    }

    const poll = await PollModel.findOne({ postId });
    if (!poll) {
      res.status(404).json({ message: "Poll not found" });
      return;
    }

    if (poll.endsAt && poll.endsAt < new Date()) {
      res.status(400).json({ message: "Poll has ended" });
      return;
    }

    const validOptionIds = poll.options.map((o: any) => o._id.toString());
    const invalidOptions = optionIds.filter((id) => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      res.status(400).json({ message: "Invalid option IDs" });
      return;
    }

    if (!poll.allowMultipleVotes && optionIds.length > 1) {
      res.status(400).json({ message: "This poll only allows one vote" });
      return;
    }

    const existingVotes = await PollVoteModel.find({ pollId: poll._id, userId });

    if (existingVotes.length > 0) {
      for (const vote of existingVotes) {
        const option = poll.options.find((o: any) => o._id.toString() === vote.optionId.toString());
        if (option) {
          option.voteCount = Math.max(0, option.voteCount - 1);
        }
      }
      await PollVoteModel.deleteMany({ pollId: poll._id, userId });
    }

    for (const optionId of optionIds) {
      await PollVoteModel.create({ pollId: poll._id, userId, optionId });
      const option = poll.options.find((o: any) => o._id.toString() === optionId);
      if (option) {
        option.voteCount += 1;
      }
    }

    await poll.save();

    res.json({
      message: "Vote recorded",
      poll,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SAVED ITEMS ====================

export const savePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const post = await PostModel.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const canView = await canViewPost(userId, post);
    if (!canView) {
      res.status(403).json({ message: "You cannot save this post" });
      return;
    }

    const existing = await SavedItemModel.findOne({
      userId,
      itemType: SavedItemType.post,
      itemId: postId,
    });

    if (existing) {
      res.status(400).json({ message: "Post already saved" });
      return;
    }

    await SavedItemModel.create({
      userId,
      itemType: SavedItemType.post,
      itemId: postId,
    });

    res.status(201).json({ message: "Post saved" });
  } catch (error) {
    next(error);
  }
};

export const unsavePost: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { postId } = req.params;

    const saved = await SavedItemModel.findOneAndDelete({
      userId,
      itemType: SavedItemType.post,
      itemId: postId,
    });

    if (!saved) {
      res.status(404).json({ message: "Saved item not found" });
      return;
    }

    res.json({ message: "Post unsaved" });
  } catch (error) {
    next(error);
  }
};

export const getSavedPosts: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const savedItems = await SavedItemModel.find({
      userId,
      itemType: SavedItemType.post,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = savedItems.map((s) => s.itemId);

    const posts = await PostModel.find({
      _id: { $in: postIds },
      deletedAt: null,
    })
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    const postMap = new Map<string, any>();
    posts.forEach((p) => postMap.set(p._id.toString(), p));

    const [allMedia, allPolls, userVotes] = await Promise.all([
      PostMediaModel.find({ postId: { $in: postIds }, deletedAt: null }).lean(),
      PollModel.find({ postId: { $in: postIds } }).lean(),
      VoteModel.find({ userId, postId: { $in: postIds } }).lean(),
    ]);

    const mediaByPost = new Map<string, any[]>();
    allMedia.forEach((m) => {
      const key = m.postId.toString();
      if (!mediaByPost.has(key)) mediaByPost.set(key, []);
      mediaByPost.get(key)!.push(m);
    });

    const pollByPost = new Map<string, any>();
    allPolls.forEach((p) => pollByPost.set(p.postId.toString(), p));

    const voteByPost = new Map<string, string>();
    userVotes.forEach((v) => voteByPost.set(v.postId.toString(), v.voteType));

    // Fetch user's poll votes
    const pollIds = allPolls.map((p) => p._id);
    const userPollVotes = pollIds.length > 0
      ? await PollVoteModel.find({ pollId: { $in: pollIds }, userId }).lean()
      : [];
    const pollVotesByPoll = new Map<string, string[]>();
    userPollVotes.forEach((v) => {
      const key = v.pollId.toString();
      if (!pollVotesByPoll.has(key)) pollVotesByPoll.set(key, []);
      pollVotesByPoll.get(key)!.push(v.optionId.toString());
    });

    const enrichedPosts = savedItems
      .map((saved) => {
        const post = postMap.get(saved.itemId.toString());
        if (!post) return null;
        const poll = pollByPost.get(post._id.toString());
        return {
          ...post,
          media: mediaByPost.get(post._id.toString()) || [],
          poll: poll ? { ...poll, userVotes: pollVotesByPoll.get(poll._id.toString()) || [] } : null,
          userVote: voteByPost.get(post._id.toString()) || null,
          savedAt: (saved as any).createdAt,
        };
      })
      .filter(Boolean);

    const total = await SavedItemModel.countDocuments({
      userId,
      itemType: SavedItemType.post,
    });

    res.json({
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HASHTAG SEARCH ====================

export const getPostsByHashtag: RequestHandler = async (req, res, next) => {
  try {
    const { tag } = req.params;
    const viewerId = req.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const hashtag = await HashtagModel.findOne({ tag: tag.toLowerCase() });
    if (!hashtag) {
      res.json({
        posts: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
      return;
    }

    const postHashtags = await PostHashtagModel.find({ hashtagId: hashtag._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = postHashtags.map((ph) => ph.postId);

    const posts = await PostModel.find({
      _id: { $in: postIds },
      deletedAt: null,
      privacy: PostPrivacy.public,
    })
      .populate("userId", "firstName lastName username avatar verified")
      .lean();

    const [allMedia, allPolls, userVotes] = await Promise.all([
      PostMediaModel.find({ postId: { $in: postIds }, deletedAt: null }).lean(),
      PollModel.find({ postId: { $in: postIds } }).lean(),
      viewerId ? VoteModel.find({ userId: viewerId, postId: { $in: postIds } }).lean() : [],
    ]);

    const mediaByPost = new Map<string, any[]>();
    allMedia.forEach((m) => {
      const key = m.postId.toString();
      if (!mediaByPost.has(key)) mediaByPost.set(key, []);
      mediaByPost.get(key)!.push(m);
    });

    const pollByPost = new Map<string, any>();
    allPolls.forEach((p) => pollByPost.set(p.postId.toString(), p));

    const voteByPost = new Map<string, string>();
    userVotes.forEach((v) => voteByPost.set(v.postId.toString(), v.voteType));

    // Fetch user's poll votes
    const pollIds = allPolls.map((p) => p._id);
    const userPollVotes = pollIds.length > 0 && viewerId
      ? await PollVoteModel.find({ pollId: { $in: pollIds }, userId: viewerId }).lean()
      : [];
    const pollVotesByPoll = new Map<string, string[]>();
    userPollVotes.forEach((v) => {
      const key = v.pollId.toString();
      if (!pollVotesByPoll.has(key)) pollVotesByPoll.set(key, []);
      pollVotesByPoll.get(key)!.push(v.optionId.toString());
    });

    const enrichedPosts = posts.map((post) => {
      const poll = pollByPost.get(post._id.toString());
      return {
        ...post,
        media: mediaByPost.get(post._id.toString()) || [],
        poll: poll ? { ...poll, userVotes: pollVotesByPoll.get(poll._id.toString()) || [] } : null,
        userVote: voteByPost.get(post._id.toString()) || null,
      };
    });

    const total = await PostHashtagModel.countDocuments({ hashtagId: hashtag._id });

    res.json({
      hashtag,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingHashtags: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const hashtags = await HashtagModel.find()
      .sort({ postCount: -1, lastUsedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ hashtags });
  } catch (error) {
    next(error);
  }
};
