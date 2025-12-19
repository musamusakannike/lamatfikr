import { apiClient } from "@/lib/api";

export type VerificationStatus = "pending" | "approved" | "rejected";
export type DocumentType = "passport" | "national_id" | "drivers_license";

export interface VerificationRequest {
  _id: string;
  userId: string;
  documentType: DocumentType;
  status: VerificationStatus;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CreateVerificationRequestInput {
  documentType: DocumentType;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl?: string;
}

export const verificationApi = {
  createRequest: (data: CreateVerificationRequestInput) =>
    apiClient.post<{ message: string; request: { id: string; documentType: DocumentType; status: VerificationStatus; createdAt: string } }>(
      "/verification/request",
      data
    ),

  getMyRequests: () => apiClient.get<{ requests: VerificationRequest[] }>("/verification/my-requests"),
};
