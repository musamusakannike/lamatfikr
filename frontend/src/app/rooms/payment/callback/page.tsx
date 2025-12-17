"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { roomsApi } from "@/lib/api/rooms";
import { getErrorMessage } from "@/lib/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const roomId = searchParams.get("roomId");
      const tapId = searchParams.get("tap_id");

      if (!roomId || !tapId) {
        setStatus("error");
        setMessage(t("payment", "missingPaymentInfo"));
        return;
      }

      try {
        const response = await roomsApi.verifyPaymentAndJoin(roomId, tapId);
        setStatus("success");
        setMessage(response.message || "Payment successful! You have joined the room.");
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err));
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) p-4">
      <div className="max-w-md w-full bg-(--bg-card) rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={64} className="animate-spin text-primary-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-(--text) mb-2">{t("payment", "verifyingPayment")}</h1>
            <p className="text-(--text-muted)">{t("payment", "pleaseWait")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">{t("payment", "paymentSuccessful")}</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
              {t("payment", "goToRooms")}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">{t("payment", "paymentFailed")}</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
                {t("payment", "backToRooms")}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                {t("payment", "tryAgain")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg)">
          <Loader2 size={64} className="animate-spin text-primary-600" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
