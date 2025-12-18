"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { profileApi } from "@/lib/api/index";
import { getErrorMessage } from "@/lib/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

function VerifiedCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [verifiedUntil, setVerifiedUntil] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const tapId = searchParams.get("tap_id");

      if (!tapId) {
        setStatus("error");
        setMessage("Missing payment information");
        return;
      }

      try {
        const response = await profileApi.verifyVerifiedTagPurchase(tapId);
        setStatus("success");
        setMessage(response.message || "Payment verified successfully");
        setVerifiedUntil(response.verifiedUntil || null);
        await refreshUser();
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err));
      }
    };

    verifyPayment();
  }, [searchParams, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) p-4">
      <div className="max-w-md w-full bg-(--bg-card) rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={64} className="animate-spin text-primary-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-(--text) mb-2">Verifying payment</h1>
            <p className="text-(--text-muted)">Please wait…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">You are verified</h1>
            <p className="text-(--text-muted) mb-4">{message}</p>
            {verifiedUntil && (
              <p className="text-sm text-(--text-muted) mb-6">
                Valid until <span className="font-semibold text-(--text)">{new Date(verifiedUntil).toLocaleDateString()}</span>
              </p>
            )}
            <Button variant="primary" className="w-full" onClick={() => router.push("/profile")}>
              Back to profile
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">Payment failed</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/profile")}>
                Back to profile
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                Try again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifiedCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg)">
          <Loader2 size={64} className="animate-spin text-primary-600" />
        </div>
      }
    >
      <VerifiedCallbackContent />
    </Suspense>
  );
}
