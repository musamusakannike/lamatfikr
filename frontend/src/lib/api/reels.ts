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
};
