// import { apiClient } from "@/lib/api";

export interface UploadResponse {
  message: string;
  url: string;
  key: string;
  type?: "image" | "video" | "audio";
}

export const uploadApi = {
  uploadImage: async (file: File, folder?: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = folder ? `/upload/image?folder=${encodeURIComponent(folder)}` : "/upload/image";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${url}`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Upload failed");
    }

    return response.json();
  },

  uploadMedia: async (file: File, folder?: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = folder ? `/upload/media?folder=${encodeURIComponent(folder)}` : "/upload/media";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${url}`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Upload failed");
    }

    return response.json();
  },
};
