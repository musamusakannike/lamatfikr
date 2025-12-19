export interface AdminUserLite {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  verified?: boolean;
}

export interface AdminCommunity {
  _id: string;
  name: string;
  description: string;
  image?: string;
  category: string;
  ownerId: string | AdminUserLite;
  memberCount: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCommunitiesResponse {
  success: boolean;
  communities: AdminCommunity[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCommunityMember {
  _id: string;
  communityId: string;
  userId: string | AdminUserLite;
  role: "owner" | "admin" | "member";
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminCommunityMembersResponse {
  success: boolean;
  members: AdminCommunityMember[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCommunityMessage {
  _id: string;
  communityId: string;
  senderId: string | AdminUserLite;
  content?: string;
  media?: string[];
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminCommunityMessagesResponse {
  success: boolean;
  messages: AdminCommunityMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminRoom {
  _id: string;
  name: string;
  description: string;
  image?: string;
  category: string;
  membershipType: "free" | "paid";
  price?: number;
  currency?: string;
  isPrivate: boolean;
  ownerId: string | AdminUserLite;
  memberCount: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRoomsResponse {
  success: boolean;
  rooms: AdminRoom[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminRoomMember {
  _id: string;
  roomId: string;
  userId: string | AdminUserLite;
  role: "owner" | "admin" | "member";
  status: "pending" | "approved" | "rejected" | "awaiting_payment";
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminRoomMembersResponse {
  success: boolean;
  members: AdminRoomMember[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminRoomMessage {
  _id: string;
  roomId: string;
  senderId: string | AdminUserLite;
  content?: string;
  media?: string[];
  deletedAt?: string | null;
  createdAt?: string;
}

export interface AdminRoomMessagesResponse {
  success: boolean;
  messages: AdminRoomMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminFeaturedRoom {
  _id: string;
  roomId:
    | string
    | {
        _id: string;
        name?: string;
        description?: string;
        image?: string;
        category?: string;
        membershipType?: string;
        price?: number;
        currency?: string;
        memberCount?: number;
        deletedAt?: string | null;
      };
  userId: string | AdminUserLite;
  startDate: string;
  endDate: string;
  days: number;
  amount: number;
  currency: string;
  status: "pending" | "active" | "expired" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminFeaturedRoomsResponse {
  success: boolean;
  featuredRooms: AdminFeaturedRoom[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
