import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getFeed,
  getUserPosts,
  votePost,
  removeVote,
  votePoll,
  savePost,
  unsavePost,
  getSavedPosts,
  getPostsByHashtag,
  getTrendingHashtags,
} from "../controllers/post.controller";
import {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
  reactToComment,
  removeCommentReaction,
  saveComment,
  unsaveComment,
} from "../controllers/comment.controller";

export const postsRouter = Router();

// Post CRUD
postsRouter.post("/", requireAuth, createPost);
postsRouter.get("/feed", requireAuth, getFeed);
postsRouter.get("/saved", requireAuth, getSavedPosts);
postsRouter.get("/user/:userId", getUserPosts);
postsRouter.get("/hashtag/:tag", getPostsByHashtag);
postsRouter.get("/hashtags/trending", getTrendingHashtags);
postsRouter.get("/:postId", getPost);
postsRouter.patch("/:postId", requireAuth, updatePost);
postsRouter.delete("/:postId", requireAuth, deletePost);

// Voting
postsRouter.post("/:postId/vote", requireAuth, votePost);
postsRouter.delete("/:postId/vote", requireAuth, removeVote);

// Poll voting
postsRouter.post("/:postId/poll/vote", requireAuth, votePoll);

// Save post
postsRouter.post("/:postId/save", requireAuth, savePost);
postsRouter.delete("/:postId/save", requireAuth, unsavePost);

// Comments
postsRouter.post("/:postId/comments", requireAuth, createComment);
postsRouter.get("/:postId/comments", getComments);
postsRouter.get("/:postId/comments/:commentId/replies", getReplies);
postsRouter.patch("/:postId/comments/:commentId", requireAuth, updateComment);
postsRouter.delete("/:postId/comments/:commentId", requireAuth, deleteComment);

// Comment reactions
postsRouter.post("/:postId/comments/:commentId/react", requireAuth, reactToComment);
postsRouter.delete("/:postId/comments/:commentId/react", requireAuth, removeCommentReaction);

// Save comment
postsRouter.post("/:postId/comments/:commentId/save", requireAuth, saveComment);
postsRouter.delete("/comments/:commentId/save", requireAuth, unsaveComment);
