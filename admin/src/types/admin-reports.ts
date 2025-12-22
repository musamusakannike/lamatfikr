export interface AdminReport {
    _id: string;
    reporterId: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar?: string;
    };
    targetType: "user" | "post" | "comment" | "room";
    targetId: string;
    reason: string;
    status: "open" | "reviewing" | "resolved" | "rejected";
    createdAt: string;
    updatedAt: string;
}

export interface AdminReportsListResponse {
    reports: AdminReport[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
