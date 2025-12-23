import api from "../api";

export interface SuggestedUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified: boolean;
  bio?: string;
  followersCount: number;
  suggestionScore: number;
}

export interface MutualConnection {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified: boolean;
}

export interface SuggestedUsersResponse {
  users: SuggestedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MutualConnectionsResponse {
  mutualConnections: MutualConnection[];
  count: number;
}

export interface NearbyUsersResponse {
  users: SuggestedUser[];
  page: number;
  hasMore: boolean;
}

export const userSuggestionsApi = {
  getSuggestedUsers: async (page = 1, limit = 10): Promise<SuggestedUsersResponse> => {
    const response = await api.get(`/users/suggested?page=${page}&limit=${limit}`);
    return response.data;
  },

  getMutualConnections: async (targetUserId: string): Promise<MutualConnectionsResponse> => {
    const response = await api.get(`/users/mutual/${targetUserId}`);
    return response.data;
  },

  getNearestUsers: async (page = 1, limit = 20): Promise<NearbyUsersResponse> => {
    const response = await api.get(`/users/nearest?page=${page}&limit=${limit}`);
    return response.data;
  },
};
