import { apiClient } from "@/lib/api";

export const reportApi = {
    createReport: (data: { targetType: string; targetId: string; reason: string }) =>
        apiClient.post<{ message: string }>("/reports", data),
};
