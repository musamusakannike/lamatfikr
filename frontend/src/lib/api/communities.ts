import { apiClient } from "../api";

export type CommunityMessageAttachmentType = "image" | "video" | "audio";

export interface CommunityMessageAttachment {
  url: string;
  type: CommunityMessageAttachmentType;
  name?: string;
  size?: number;
}

export interface CommunityMessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface CommunityMessageReaction {
  emoji: string;
  userId: string;
}

export interface CommunityOwner {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  image?: string;
  coverImage?: string;
  category: string;
  memberCount: number;
  owner: CommunityOwner;
  isMember: boolean;
  role: "owner" | "admin" | "member" | null;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
}

export interface CommunityMember {
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  content?: string;
  media?: string[];
  attachments?: CommunityMessageAttachment[];
  location?: CommunityMessageLocation;
  reactions?: CommunityMessageReaction[];
  createdAt: string;
}

export interface CreateCommunityData {
  name: string;
  description: string;
  image?: string;
  coverImage?: string;
  category: string;
}

export interface CommunitiesResponse {
  communities: Community[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CommunityResponse {
  community: Community;
}

export interface MembersResponse {
  members: CommunityMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MessagesResponse {
  messages: CommunityMessage[];
  hasMore: boolean;
}

// Community CRUD
export const communitiesApi = {
  // Get total unread count for sidebar
  getTotalUnreadCount: () => {
    return apiClient.get<{ totalUnreadCount: number }>("/communities/unread-count");
  },

  // Get all communities with filters
  getCommunities: (params?: {
    search?: string;
    category?: string;
    filter?: "all" | "owned" | "joined";
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.filter) searchParams.set("filter", params.filter);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<CommunitiesResponse>(`/communities${query ? `?${query}` : ""}`);
  },

  // Get single community
  getCommunity: (communityId: string) => {
    return apiClient.get<CommunityResponse>(`/communities/${communityId}`);
  },

  // Create community
  createCommunity: (data: CreateCommunityData) => {
    return apiClient.post<{ message: string; community: Community }>("/communities", data);
  },

  // Update community
  updateCommunity: (communityId: string, data: Partial<CreateCommunityData>) => {
    return apiClient.patch<{ message: string; community: Community }>(`/communities/${communityId}`, data);
  },

  // Delete community
  deleteCommunity: (communityId: string) => {
    return apiClient.delete<{ message: string }>(`/communities/${communityId}`);
  },

  // Join community
  joinCommunity: (communityId: string) => {
    return apiClient.post<{ message: string; membership: { communityId: string; role: string } }>(
      `/communities/${communityId}/join`
    );
  },

  // Leave community
  leaveCommunity: (communityId: string) => {
    return apiClient.post<{ message: string }>(`/communities/${communityId}/leave`);
  },

  // Get community members
  getMembers: (communityId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<MembersResponse>(`/communities/${communityId}/members${query ? `?${query}` : ""}`);
  },

  // Send message
  sendMessage: (communityId: string, data: { content?: string; media?: string[]; attachments?: CommunityMessageAttachment[]; location?: CommunityMessageLocation }) => {
    return apiClient.post<{ message: string; data: CommunityMessage }>(`/communities/${communityId}/messages`, data);
  },

  toggleReaction: (communityId: string, messageId: string, emoji: string) => {
    return apiClient.post<{ message: string; data: { messageId: string; reactions: CommunityMessageReaction[] } }>(
      `/communities/${communityId}/messages/${messageId}/reactions`,
      { emoji }
    );
  },

  // Get messages
  getMessages: (communityId: string, params?: { limit?: number; before?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.before) searchParams.set("before", params.before);

    const query = searchParams.toString();
    return apiClient.get<MessagesResponse>(`/communities/${communityId}/messages${query ? `?${query}` : ""}`);
  },

  // Mark community as read
  markAsRead: (communityId: string) => {
    return apiClient.post<{ message: string }>(`/communities/${communityId}/read`);
  },
};

export default communitiesApi;
