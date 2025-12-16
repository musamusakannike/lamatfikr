import { apiClient } from "@/lib/api";

export interface UserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  bio?: string;
}

export interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  [key: string]: T[] | PaginatedResponse<T>["pagination"];
}

export interface FollowersResponse extends PaginatedResponse<UserSummary> {
  followers: UserSummary[];
}

export interface FollowingResponse extends PaginatedResponse<UserSummary> {
  following: UserSummary[];
}

export interface FriendsResponse extends PaginatedResponse<UserSummary> {
  friends: UserSummary[];
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export const socialApi = {
  // Follow endpoints
  followUser: (followingId: string) =>
    apiClient.post<{ message: string }>("/social/follow", { followingId }),

  unfollowUser: (followingId: string) =>
    apiClient.post<{ message: string }>("/social/unfollow", { followingId }),

  checkFollowStatus: (targetUserId: string) =>
    apiClient.get<FollowStatusResponse>(`/social/follow-status/${targetUserId}`),

  getFollowers: (userId?: string, page = 1, limit = 20) => {
    const url = userId
      ? `/social/followers/${userId}?page=${page}&limit=${limit}`
      : `/social/followers?page=${page}&limit=${limit}`;
    return apiClient.get<FollowersResponse>(url);
  },

  getFollowing: (userId?: string, page = 1, limit = 20) => {
    const url = userId
      ? `/social/following/${userId}?page=${page}&limit=${limit}`
      : `/social/following?page=${page}&limit=${limit}`;
    return apiClient.get<FollowingResponse>(url);
  },

  // Friend endpoints
  sendFriendRequest: (addresseeId: string) =>
    apiClient.post<{ message: string }>("/social/friends/request", {
      addresseeId,
    }),

  respondToFriendRequest: (requesterId: string, accept: boolean) =>
    apiClient.post<{ message: string }>("/social/friends/respond", {
      requesterId,
      accept,
    }),

  unfriend: (friendId: string) =>
    apiClient.delete<{ message: string }>(`/social/friends/${friendId}`),

  getFriends: (page = 1, limit = 20) =>
    apiClient.get<FriendsResponse>(
      `/social/friends?page=${page}&limit=${limit}`
    ),

  getPendingFriendRequests: (page = 1, limit = 20) =>
    apiClient.get<{ requests: unknown[]; pagination: PaginatedResponse<unknown>["pagination"] }>(
      `/social/friends/requests/pending?page=${page}&limit=${limit}`
    ),

  getSentFriendRequests: (page = 1, limit = 20) =>
    apiClient.get<{ requests: unknown[]; pagination: PaginatedResponse<unknown>["pagination"] }>(
      `/social/friends/requests/sent?page=${page}&limit=${limit}`
    ),

  // Block endpoints
  blockUser: (blockedId: string, reason?: string) =>
    apiClient.post<{ message: string }>("/social/block", { blockedId, reason }),

  unblockUser: (blockedId: string) =>
    apiClient.post<{ message: string }>("/social/unblock", { blockedId }),

  getBlockedUsers: (page = 1, limit = 20) =>
    apiClient.get<{ blockedUsers: UserSummary[]; pagination: PaginatedResponse<unknown>["pagination"] }>(
      `/social/blocked?page=${page}&limit=${limit}`
    ),

  // Mute endpoints
  muteUser: (mutedId: string, duration?: number) =>
    apiClient.post<{ message: string }>("/social/mute", { mutedId, duration }),

  unmuteUser: (mutedId: string) =>
    apiClient.post<{ message: string }>("/social/unmute", { mutedId }),

  getMutedUsers: (page = 1, limit = 20) =>
    apiClient.get<{ mutedUsers: { user: UserSummary; expiresAt?: string }[]; pagination: PaginatedResponse<unknown>["pagination"] }>(
      `/social/muted?page=${page}&limit=${limit}`
    ),
};
