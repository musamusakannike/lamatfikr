
import { apiClient } from "@/lib/api";

export const streamApi = {
    getToken: () => apiClient.get<{ token: string }>("/auth/stream-token"),
};
