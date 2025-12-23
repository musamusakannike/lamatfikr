import { apiClient } from "../api";

export type RoomMessageAttachmentType = "image" | "video" | "audio";

export interface RoomMessageAttachment {
  url: string;
  type: RoomMessageAttachmentType;
  name?: string;
  size?: number;
}

export interface RoomMessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface RoomMessageReaction {
  emoji: string;
  userId: string;
}

export interface RoomOwner {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  image?: string;
  category: string;
  membershipType: "free" | "paid";
  price?: number;
  currency?: string;
  isPrivate: boolean;
  memberCount: number;
  owner: RoomOwner;
  isMember: boolean;
  role: "owner" | "admin" | "member" | null;
  membershipStatus?: "pending" | "approved" | "rejected" | null;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
}

export interface RoomMember {
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  content?: string;
  media?: string[];
  attachments?: RoomMessageAttachment[];
  location?: RoomMessageLocation;
  reactions?: RoomMessageReaction[];
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  isViewOnce?: boolean;
  isExpired?: boolean;
}

export interface CreateRoomData {
  name: string;
  description: string;
  image?: string;
  category: string;
  membershipType: "free" | "paid";
  price?: number;
  currency?: string;
  isPrivate: boolean;
}

export interface RoomsResponse {
  rooms: Room[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RoomResponse {
  room: Room;
}

export interface MembersResponse {
  members: RoomMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MessagesResponse {
  messages: RoomMessage[];
  hasMore: boolean;
}

export interface PaymentInitResponse {
  message: string;
  redirectUrl: string;
  chargeId: string;
}

export interface MembershipRequest {
  id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  requestedAt: string;
}

export interface InviteLink {
  id: string;
  token: string;
  shareUrl: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface InviteLinkResponse {
  message: string;
  inviteLink: InviteLink;
}

export interface InviteLinksResponse {
  inviteLinks: InviteLink[];
}

// Room CRUD
export const roomsApi = {
  // Get total unread count for sidebar
  getTotalUnreadCount: () => {
    return apiClient.get<{ totalUnreadCount: number }>("/rooms/unread-count");
  },

  // Get all rooms with filters
  getRooms: (params?: {
    search?: string;
    category?: string;
    membershipType?: string;
    filter?: "all" | "owned" | "joined";
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.membershipType) searchParams.set("membershipType", params.membershipType);
    if (params?.filter) searchParams.set("filter", params.filter);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<RoomsResponse>(`/rooms${query ? `?${query}` : ""}`);
  },

  // Get single room
  getRoom: (roomId: string) => {
    return apiClient.get<RoomResponse>(`/rooms/${roomId}`);
  },

  // Create room
  createRoom: (data: CreateRoomData) => {
    return apiClient.post<{ message: string; room: Room }>("/rooms", data);
  },

  // Update room
  updateRoom: (roomId: string, data: Partial<CreateRoomData>) => {
    return apiClient.patch<{ message: string; room: Room }>(`/rooms/${roomId}`, data);
  },

  // Delete room
  deleteRoom: (roomId: string) => {
    return apiClient.delete<{ message: string }>(`/rooms/${roomId}`);
  },

  // Join free room
  joinFreeRoom: (roomId: string) => {
    return apiClient.post<{ message: string; membership: { roomId: string; role: string; status: string } }>(
      `/rooms/${roomId}/join`
    );
  },

  // Initiate paid room join (get payment URL)
  initiatePaidJoin: (roomId: string) => {
    return apiClient.post<PaymentInitResponse>(`/rooms/${roomId}/join/pay`);
  },

  // Verify payment and complete join
  verifyPaymentAndJoin: (roomId: string, tapId: string) => {
    return apiClient.get<{ message: string; membership: { roomId: string; status: string; paidAt: string } }>(
      `/rooms/${roomId}/join/verify?tap_id=${tapId}`
    );
  },

  // Leave room
  leaveRoom: (roomId: string) => {
    return apiClient.post<{ message: string }>(`/rooms/${roomId}/leave`);
  },

  // Get room members
  getMembers: (roomId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<MembersResponse>(`/rooms/${roomId}/members${query ? `?${query}` : ""}`);
  },

  // Get pending membership requests (owner/admin only)
  getPendingRequests: (roomId: string) => {
    return apiClient.get<{
      requests: Array<{
        id: string;
        user: {
          _id: string;
          username: string;
          displayName?: string;
          avatar?: string;
        };
        requestedAt: string;
      }>;
    }>(`/rooms/${roomId}/requests`);
  },

  // Handle membership request (approve/reject)
  handleMembershipRequest: (roomId: string, memberId: string, action: "approve" | "reject") => {
    return apiClient.post<{ message: string }>(`/rooms/${roomId}/requests/${memberId}`, { action });
  },

  // Send message
  sendMessage: (roomId: string, data: { content?: string; media?: string[]; attachments?: RoomMessageAttachment[]; location?: RoomMessageLocation; isViewOnce?: boolean }) => {
    return apiClient.post<{ message: string; data: RoomMessage }>(`/rooms/${roomId}/messages`, data);
  },

  toggleReaction: (roomId: string, messageId: string, emoji: string) => {
    return apiClient.post<{ message: string; data: { messageId: string; reactions: RoomMessageReaction[] } }>(
      `/rooms/${roomId}/messages/${messageId}/reactions`,
      { emoji }
    );
  },

  // Get messages
  getMessages: (roomId: string, params?: { limit?: number; before?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.before) searchParams.set("before", params.before);

    const query = searchParams.toString();
    return apiClient.get<MessagesResponse>(`/rooms/${roomId}/messages${query ? `?${query}` : ""}`);
  },

  // Mark room as read
  markAsRead: (roomId: string) => {
    return apiClient.post<{ message: string }>(`/rooms/${roomId}/read`);
  },

  // Generate invite link
  generateInviteLink: (roomId: string, data?: { expiresIn?: number; maxUses?: number }) => {
    return apiClient.post<InviteLinkResponse>(`/rooms/${roomId}/invite-links`, data || {});
  },

  // Get all invite links for a room
  getInviteLinks: (roomId: string) => {
    return apiClient.get<InviteLinksResponse>(`/rooms/${roomId}/invite-links`);
  },

  // Revoke an invite link
  revokeInviteLink: (roomId: string, linkId: string) => {
    return apiClient.delete<{ message: string }>(`/rooms/${roomId}/invite-links/${linkId}`);
  },

  // Join room via invite link
  joinViaInviteLink: (token: string) => {
    return apiClient.post<{
      message: string;
      status: "approved" | "pending";
      membership: { roomId: string; role: string; status: string };
      room: {
        id: string;
        name: string;
        description: string;
        image?: string;
        category: string;
        membershipType?: string;
        price?: number;
        currency?: string;
      };
    }>(`/rooms/invite/${token}/join`);
  },

  // Delete message
  deleteMessage: (roomId: string, messageId: string) => {
    return apiClient.delete<{ message: string }>(`/rooms/${roomId}/messages/${messageId}`);
  },

  // Edit message
  editMessage: (roomId: string, messageId: string, content: string) => {
    return apiClient.patch<{ message: string; data: RoomMessage }>(
      `/rooms/${roomId}/messages/${messageId}`,
      { content }
    );
  },

  // Mark message as viewed (View Once)
  markAsViewed: (roomId: string, messageId: string) => {
    return apiClient.post<{ message: string; data: { content?: string; media?: string[]; attachments?: RoomMessageAttachment[] } }>(
      `/rooms/${roomId}/messages/${messageId}/view`
    );
  },
};

export default roomsApi;
