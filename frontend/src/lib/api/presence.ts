import { apiClient } from "@/lib/api";

export interface PresenceResponse {
  userId: string;
  isOnline: boolean;
}

export const presenceApi = {
  getUserPresence: (userId: string) =>
    apiClient.get<PresenceResponse>(`/presence/${userId}`),
};
