import { apiClient } from "@/lib/api";

export interface Reel {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  privacy: string;
  location?: string;
  feeling?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  userLiked?: boolean;
  userViewed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReelData {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  privacy?: string;
  location?: string;
  feeling?: string;
}

export interface UpdateReelData {
  caption?: string;
  privacy?: string;
  location?: string;
  feeling?: string;
}

export interface ReelsResponse {
  reels: Reel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Comment {
  _id: string;
  postId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  parentCommentId?: string | null;
  content: string;
  media?: string[];
  reactionCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
  media?: string[];
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const reelsApi = {
  async createReel(data: CreateReelData): Promise<{ message: string; reel: Reel }> {
    return apiClient.post<{ message: string; reel: Reel }>("/reels", data);
  },

  async getReelsFeed(page = 1, limit = 20): Promise<ReelsResponse> {
    return apiClient.get<ReelsResponse>("/reels/feed", {
      params: { page, limit },
    });
  },

  async getReel(reelId: string): Promise<{ reel: Reel }> {
    return apiClient.get<{ reel: Reel }>(`/reels/${reelId}`);
  },

  async getUserReels(userId: string, page = 1, limit = 20): Promise<ReelsResponse> {
    return apiClient.get<ReelsResponse>(`/reels/user/${userId}`, {
      params: { page, limit },
    });
  },

  async updateReel(reelId: string, data: UpdateReelData): Promise<{ message: string; reel: Reel }> {
    return apiClient.put<{ message: string; reel: Reel }>(`/reels/${reelId}`, data);
  },

  async deleteReel(reelId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reels/${reelId}`);
  },

  async likeReel(reelId: string): Promise<{ message: string; liked: boolean }> {
    return apiClient.post<{ message: string; liked: boolean }>(`/reels/${reelId}/like`);
  },

  async recordView(reelId: string, watchDuration: number): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/reels/${reelId}/view`, { watchDuration });
  },

  async shareReel(reelId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/reels/${reelId}/share`);
  },

  // Comments
  async createComment(reelId: string, data: CreateCommentData): Promise<{ message: string; comment: Comment }> {
    return apiClient.post<{ message: string; comment: Comment }>(`/reels/${reelId}/comments`, data);
  },

  async getComments(reelId: string, page = 1, limit = 20): Promise<CommentsResponse> {
    return apiClient.get<CommentsResponse>(`/reels/${reelId}/comments`, {
      params: { page, limit },
    });
  },

  async getReplies(reelId: string, commentId: string, page = 1, limit = 20): Promise<{ replies: Comment[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    return apiClient.get<{ replies: Comment[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/reels/${reelId}/comments/${commentId}/replies`, {
      params: { page, limit },
    });
  },

  async updateComment(reelId: string, commentId: string, content: string): Promise<{ message: string; comment: Comment }> {
    return apiClient.patch<{ message: string; comment: Comment }>(`/reels/${reelId}/comments/${commentId}`, { content });
  },

  async deleteComment(reelId: string, commentId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reels/${reelId}/comments/${commentId}`);
  },
};

