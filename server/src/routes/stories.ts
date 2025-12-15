import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  createStory,
  getStories,
  getStory,
  deleteStory,
  viewStory,
  getStoryViewers,
  getUserStories,
  getMyStories,
} from "../controllers/story.controller";

export const storiesRouter = Router();

// Story CRUD
storiesRouter.post("/", requireAuth, createStory);
storiesRouter.get("/", requireAuth, getStories);
storiesRouter.get("/me", requireAuth, getMyStories);
storiesRouter.get("/user/:userId", requireAuth, getUserStories);
storiesRouter.get("/:storyId", requireAuth, getStory);
storiesRouter.delete("/:storyId", requireAuth, deleteStory);

// Story views
storiesRouter.post("/:storyId/view", requireAuth, viewStory);
storiesRouter.get("/:storyId/viewers", requireAuth, getStoryViewers);
