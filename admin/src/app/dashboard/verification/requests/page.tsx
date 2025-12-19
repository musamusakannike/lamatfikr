"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient, getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type VerificationStatus = "pending" | "approved" | "rejected";
type DocumentType = "passport" | "national_id" | "drivers_license";

type VerificationUser = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  avatar?: string;
};

type VerificationRequestItem = {
  _id: string;
  userId: VerificationUser;
  documentType: DocumentType;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  status: VerificationStatus;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
};

type AdminVerificationListResponse = {
  requests: VerificationRequestItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function VerificationRequestsPage() {
  const { t, isRTL } = useLanguage();

  const [status, setStatus] = useState<"all" | VerificationStatus>("pending");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [data, setData] = useState<AdminVerificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [page, limit, status]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<AdminVerificationListResponse>(`/verification/admin/requests?${queryString}`);
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(getErrorMessage(e) || t("adminVerification", "failedToLoad"));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [queryString, t]);

  const canPrev = (data?.pagination.page ?? 1) > 1;
  const canNext = (data?.pagination.page ?? 1) < (data?.pagination.totalPages ?? 1);

  const review = async (request: VerificationRequestItem, nextStatus: "approved" | "rejected") => {
    const promptKey = nextStatus === "approved" ? "notesPromptApprove" : "notesPromptReject";
    const adminNotes = window.prompt(t("adminVerification", promptKey)) || "";

    setBusyId(request._id);
    try {
      await apiClient.post(`/verification/admin/requests/${request._id}/review`, {
        status: nextStatus,
        adminNotes: adminNotes.trim() ? adminNotes.trim() : undefined,
      });

      const res = await apiClient.get<AdminVerificationListResponse>(`/verification/admin/requests?${queryString}`);
      setData(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={cn("space-y-4", isRTL ? "text-right" : "text-left")}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-(--text)">{t("adminVerification", "title")}</h1>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
        >
          <option value="all">{t("adminVerification", "statusAll")}</option>
          <option value="pending">{t("adminVerification", "statusPending")}</option>
          <option value="approved">{t("adminVerification", "statusApproved")}</option>
          <option value="rejected">{t("adminVerification", "statusRejected")}</option>
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-(--text-muted)">{t("adminVerification", "loading")}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--border)">
          <table className="w-full text-sm">
            <thead className="bg-(--bg-card)">
              <tr className="text-(--text-muted)">
                <th className="px-3 py-2 whitespace-nowrap">{t("adminVerification", "colUser")}</th>
                <th className="px-3 py-2 whitespace-nowrap">{t("adminVerification", "colDocumentType")}</th>
                <th className="px-3 py-2 whitespace-nowrap">{t("adminVerification", "colStatus")}</th>
                <th className="px-3 py-2 whitespace-nowrap">{t("adminVerification", "colCreatedAt")}</th>
                <th className="px-3 py-2 whitespace-nowrap">{t("adminVerification", "colReviewedAt")}</th>
                <th className="px-3 py-2 whitespace-nowrap">{t("adminVerification", "colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.requests ?? []).map((r) => {
                const isBusy = busyId === r._id;
                const userName = r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : "";
                return (
                  <tr key={r._id} className="border-t border-(--border)">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium text-(--text)">{userName}</div>
                      <div className="text-(--text-muted)">@{r.userId?.username}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-(--text)">{r.documentType}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-(--text)">{r.status}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-(--text)">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-(--text)">{formatDate(r.reviewedAt)}</td>
                    <td className="px-3 py-2">
                      <div className={cn("flex gap-2 flex-wrap", isRTL ? "justify-end" : "justify-start")}>
                        <a
                          href={r.documentFrontUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-md border border-(--border) hover:bg-(--bg)"
                        >
                          {t("adminVerification", "btnOpenFront")}
                        </a>
                        {r.documentBackUrl && (
                          <a
                            href={r.documentBackUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded-md border border-(--border) hover:bg-(--bg)"
                          >
                            {t("adminVerification", "btnOpenBack")}
                          </a>
                        )}
                        {r.selfieUrl && (
                          <a
                            href={r.selfieUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded-md border border-(--border) hover:bg-(--bg)"
                          >
                            {t("adminVerification", "btnOpenSelfie")}
                          </a>
                        )}

                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => review(r, "approved")}
                              disabled={isBusy}
                              className="px-2 py-1 rounded-md bg-green-600 text-white disabled:opacity-60"
                            >
                              {t("adminVerification", "btnApprove")}
                            </button>
                            <button
                              onClick={() => review(r, "rejected")}
                              disabled={isBusy}
                              className="px-2 py-1 rounded-md bg-red-600 text-white disabled:opacity-60"
                            >
                              {t("adminVerification", "btnReject")}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(data?.requests?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-(--text-muted)">
                    {t("adminVerification", "failedToLoad")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev}
          className="px-3 py-2 rounded-lg border border-(--border) disabled:opacity-60"
        >
          {t("adminVerification", "paginationPrev")}
        </button>
        <div className="text-xs text-(--text-muted)">
          {t("adminVerification", "page")} {data?.pagination.page ?? page} / {data?.pagination.totalPages ?? 1}
        </div>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!canNext}
          className="px-3 py-2 rounded-lg border border-(--border) disabled:opacity-60"
        >
          {t("adminVerification", "paginationNext")}
        </button>
      </div>
    </div>
  );
}
