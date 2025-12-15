import { apiClient } from "@/lib/api";

export interface StoryUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface StoryMediaItem {
  url: string;
  type: "image" | "video";
}

export interface Story {
  _id: string;
  userId: StoryUser;
  media: string[];
  mediaItems: StoryMediaItem[];
  viewCount: number;
  expiresAt: string;
  hasUnviewed: boolean;
  createdAt: string;
}

export interface StoryViewer {
  user: StoryUser;
  viewedAt: string;
}

export interface CreateStoryData {
  media: string[];
  expiresInHours?: number;
}

export interface StoriesResponse {
  stories: Story[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StoryViewersResponse {
  viewers: StoryViewer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type MediaFilterType = "all" | "images" | "videos";

export const storiesApi = {
  createStory: (data: CreateStoryData) =>
    apiClient.post<{ message: string; story: Story }>("/stories", data),

  getStories: (page = 1, limit = 20, mediaType: MediaFilterType = "all") =>
    apiClient.get<StoriesResponse>(
      `/stories?page=${page}&limit=${limit}&mediaType=${mediaType}`
    ),

  getStory: (storyId: string) =>
    apiClient.get<{ story: Story }>(`/stories/${storyId}`),

  deleteStory: (storyId: string) =>
    apiClient.delete<{ message: string }>(`/stories/${storyId}`),

  viewStory: (storyId: string) =>
    apiClient.post<{ message: string }>(`/stories/${storyId}/view`),

  getStoryViewers: (storyId: string, page = 1, limit = 20) =>
    apiClient.get<StoryViewersResponse>(
      `/stories/${storyId}/viewers?page=${page}&limit=${limit}`
    ),

  getUserStories: (userId: string) =>
    apiClient.get<{ stories: Story[] }>(`/stories/user/${userId}`),

  getMyStories: () =>
    apiClient.get<{ stories: Story[] }>("/stories/me"),
};
