"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { featuredRoomsApi } from "@/lib/api/featured-rooms";
import { getErrorMessage } from "@/lib/api";
import { Loader2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";

function FeaturedCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [featuredData, setFeaturedData] = useState<{
    days: number;
    endDate: string;
    currency: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const roomId = params.roomId as string;
      const tapId = searchParams.get("tap_id");

      if (!roomId || !tapId) {
        setStatus("error");
        setMessage(t("rooms", "paymentNotCompleted"));
        return;
      }

      try {
        const response = await featuredRoomsApi.verifyFeaturedPayment(roomId, tapId);
        setStatus("success");
        setMessage(response.message || t("rooms", "paymentVerified"));
        setFeaturedData(response.featuredRoom);
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err));
      }
    };

    verifyPayment();
  }, [searchParams, params, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) p-4">
      <div className="max-w-md w-full bg-(--bg-card) rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={64} className="animate-spin text-primary-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-(--text) mb-2">{t("rooms", "verifyingPayment")}</h1>
            <p className="text-(--text-muted)">{t("rooms", "pleaseWaitVerifying")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <Sparkles size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">{t("rooms", "roomFeaturedSuccessfully")}</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            
            {featuredData && (
              <div className="bg-linear-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-(--text-muted)">{t("rooms", "duration")}:</span>
                    <span className="font-semibold">{featuredData.days} {t("rooms", "days")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--text-muted)">{t("rooms", "endDate")}:</span>
                    <span className="font-semibold">
                      {new Date(featuredData.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--text-muted)">{t("rooms", "amount")}:</span>
                    <span className="font-semibold">
                      {featuredData.currency} {featuredData.amount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
                {t("rooms", "backToRooms")}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/rooms?roomId=${params.roomId}`)}>
                {t("rooms", "goToRoom")}
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">{t("rooms", "paymentFailed")}</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
                {t("rooms", "backToRooms")}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                {t("home", "tryAgain")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FeaturedCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg)">
          <Loader2 size={64} className="animate-spin text-primary-600" />
        </div>
      }
    >
      <FeaturedCallbackContent />
    </Suspense>
  );
}
