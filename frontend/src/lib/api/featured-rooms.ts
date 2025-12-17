import { apiClient } from "../api";

export interface FeaturedRoomData {
  _id: string;
  roomId: {
    _id: string;
    name: string;
    description: string;
    image?: string;
    category: string;
    membershipType: "free" | "paid";
    price?: number;
    currency?: string;
    memberCount: number;
  };
  userId: {
    _id: string;
    username: string;
    fullName?: string;
    profilePicture?: string;
  };
  startDate: string;
  endDate: string;
  days: number;
  amount: number;
  currency: string;
  status: "pending" | "active" | "expired" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedRoomsResponse {
  featuredRooms: FeaturedRoomData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InitiateFeaturedPaymentResponse {
  message: string;
  redirectUrl: string;
  chargeId: string;
  amount: number;
  days: number;
  pricePerDay: number;
}

export interface FeaturedRoomStatusResponse {
  isFeatured: boolean;
  activeFeatured: {
    id: string;
    startDate: string;
    endDate: string;
    days: number;
    amount: number;
    currency: string;
    status: string;
  } | null;
  history: Array<{
    _id: string;
    startDate: string;
    endDate: string;
    days: number;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  pricePerDay: number;
}

export interface VerifyFeaturedPaymentResponse {
  message: string;
  featuredRoom: {
    id: string;
    startDate: string;
    endDate: string;
    days: number;
    amount: number;
    currency: string;
    status: string;
  };
}

export const featuredRoomsApi = {
  getFeaturedRooms: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<FeaturedRoomsResponse>(`/featured-rooms${query ? `?${query}` : ""}`);
  },

  initiateFeaturedPayment: (roomId: string, data: { days: number; currency?: string }) => {
    return apiClient.post<InitiateFeaturedPaymentResponse>(`/featured-rooms/${roomId}/initiate`, data);
  },

  verifyFeaturedPayment: (roomId: string, tapId: string) => {
    return apiClient.get<VerifyFeaturedPaymentResponse>(
      `/featured-rooms/${roomId}/verify?tap_id=${tapId}`
    );
  },

  getRoomFeaturedStatus: (roomId: string) => {
    return apiClient.get<FeaturedRoomStatusResponse>(`/featured-rooms/${roomId}/status`);
  },

  cancelFeaturedRoom: (roomId: string, featuredId: string) => {
    return apiClient.delete<{ message: string; featuredRoom: { id: string; status: string } }>(
      `/featured-rooms/${roomId}/${featuredId}`
    );
  },
};

export default featuredRoomsApi;
