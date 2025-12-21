"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Navbar, Sidebar } from "@/components/layout";
import { Button, Card, CardContent } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import { getErrorMessage } from "@/lib/api";
import { profileApi, uploadApi, verificationApi } from "@/lib/api/index";
import type { DocumentType, VerificationRequest, VerificationStatus } from "@/lib/api/index";

function pickLatestRequest(requests: VerificationRequest[]) {
  if (requests.length === 0) return null;
  return [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export default function ProfileVerifiedPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const latest = useMemo(() => pickLatestRequest(requests), [requests]);

  const [documentType, setDocumentType] = useState<DocumentType>("national_id");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);

  const loadMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await verificationApi.getMyRequests();
      setRequests(res.requests || []);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadMyRequests();
  }, [isAuthenticated, loadMyRequests]);

  const latestStatus: VerificationStatus | null = latest?.status ?? null;

  const canSubmitNew = !latestStatus || latestStatus === "rejected";
  const canPay = latestStatus === "approved";
  const isPending = latestStatus === "pending";

  const validateFileSize = (file: File, maxSize: number = 50 * 1024 * 1024): boolean => {
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      toast.error(`File "${file.name}" is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !validateFileSize(file)) {
      e.target.value = "";
      return;
    }
    setFrontFile(file || null);
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !validateFileSize(file)) {
      e.target.value = "";
      return;
    }
    setBackFile(file || null);
  };

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !validateFileSize(file)) {
      e.target.value = "";
      return;
    }
    setSelfieFile(file || null);
  };

  const submit = async () => {
    if (!frontFile) {
      toast.error(t("verification", "frontRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const frontUpload = await uploadApi.uploadImage(frontFile, "verification");
      const backUpload = backFile ? await uploadApi.uploadImage(backFile, "verification") : null;
      const selfieUpload = selfieFile ? await uploadApi.uploadImage(selfieFile, "verification") : null;

      await verificationApi.createRequest({
        documentType,
        documentFrontUrl: frontUpload.url,
        documentBackUrl: backUpload?.url,
        selfieUrl: selfieUpload?.url,
      });

      toast.success(t("verification", "requestSubmitted"));
      setFrontFile(null);
      setBackFile(null);
      setSelfieFile(null);
      if (frontRef.current) frontRef.current.value = "";
      if (backRef.current) backRef.current.value = "";
      if (selfieRef.current) selfieRef.current.value = "";

      await loadMyRequests();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const payNow = async () => {
    setPaying(true);
    try {
      const res = await profileApi.initiateVerifiedTagPurchase();
      if (!res.redirectUrl) {
        toast.error(t("verification", "paymentUrlMissing"));
        return;
      }
      window.location.href = res.redirectUrl;
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
            <h1 className="text-xl font-bold text-(--text)">{t("verification", "title")}</h1>
            <Button variant="outline" size="sm" onClick={() => router.push("/profile")}>
              {t("verification", "backToProfile")}
            </Button>
          </div>

          {!isAuthenticated ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">{t("verification", "loginRequired")}</p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">{t("common", "loading")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-(--text)">{t("verification", "howItWorks")}</p>

                  {latestStatus === "pending" && (
                    <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                      {t("verification", "statusPending")}
                    </div>
                  )}
                  {latestStatus === "approved" && (
                    <div className="p-3 rounded-lg border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      {t("verification", "statusApproved")}
                    </div>
                  )}
                  {latestStatus === "rejected" && (
                    <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                      <div>{t("verification", "statusRejected")}</div>
                      {latest?.adminNotes && (
                        <div className="text-sm mt-2">{t("verification", "adminNotes")}: {latest.adminNotes}</div>
                      )}
                    </div>
                  )}
                  {!latestStatus && (
                    <div className="p-3 rounded-lg border border-(--border) bg-(--bg) text-(--text)">
                      {t("verification", "statusNone")}
                    </div>
                  )}

                  <div className={cn("flex items-center gap-2 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={payNow}
                      disabled={!canPay || paying}
                    >
                      {paying ? t("verification", "paying") : t("verification", "payNow")}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMyRequests}
                      disabled={loading}
                    >
                      {t("verification", "refresh")}
                    </Button>
                  </div>

                  {!canPay && (
                    <p className="text-xs text-(--text-muted)">{t("verification", "paymentLocked")}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <h2 className="text-lg font-semibold text-(--text)">{t("verification", "uploadTitle")}</h2>

                  <div className="space-y-2">
                    <label className="text-sm text-(--text-muted)">{t("verification", "documentType")}</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                      className="w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text)"
                      disabled={!canSubmitNew || submitting || isPending}
                    >
                      <option value="passport">{t("verification", "docPassport")}</option>
                      <option value="national_id">{t("verification", "docNationalId")}</option>
                      <option value="drivers_license">{t("verification", "docDriversLicense")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-(--text-muted)">{t("verification", "frontLabel")}</label>
                    <input
                      ref={frontRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFrontFileChange}
                      className="w-full"
                      disabled={!canSubmitNew || submitting || isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-(--text-muted)">{t("verification", "backLabel")}</label>
                    <input
                      ref={backRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackFileChange}
                      className="w-full"
                      disabled={!canSubmitNew || submitting || isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-(--text-muted)">{t("verification", "selfieLabel")}</label>
                    <input
                      ref={selfieRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSelfieFileChange}
                      className="w-full"
                      disabled={!canSubmitNew || submitting || isPending}
                    />
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={submit}
                    disabled={!canSubmitNew || submitting || isPending}
                  >
                    {submitting ? t("verification", "submitting") : t("verification", "submitForReview")}
                  </Button>

                  {isPending && (
                    <p className="text-xs text-(--text-muted)">{t("verification", "cannotResubmitWhilePending")}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
