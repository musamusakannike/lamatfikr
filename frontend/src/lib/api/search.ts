import { apiClient } from "@/lib/api";

export interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface SearchPostUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  paidVerifiedUntil?: string | null;
}

export interface SearchPost {
  _id: string;
  contentText?: string;
  createdAt: string;
  upvoteCount?: number;
  downvoteCount?: number;
  userId: SearchPostUser | string;
}

export interface SearchResponse {
  users: SearchUser[];
  posts: SearchPost[];
}

export const searchApi = {
  searchAll: (q: string, limit = 5) =>
    apiClient.get<SearchResponse>(`/search/all?q=${encodeURIComponent(q)}&limit=${limit}`),
};
