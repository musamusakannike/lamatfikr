"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { featuredRoomsApi } from "@/lib/api/featured-rooms";
import { getErrorMessage } from "@/lib/api";
import { Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";

function FeaturedCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [featuredData, setFeaturedData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const roomId = params.roomId as string;
      const tapId = searchParams.get("tap_id");

      if (!roomId || !tapId) {
        setStatus("error");
        setMessage("Missing payment information. Please try again.");
        return;
      }

      try {
        const response = await featuredRoomsApi.verifyFeaturedPayment(roomId, tapId);
        setStatus("success");
        setMessage(response.message || "Payment successful! Your room is now featured.");
        setFeaturedData(response.featuredRoom);
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err));
      }
    };

    verifyPayment();
  }, [searchParams, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) p-4">
      <div className="max-w-md w-full bg-(--bg-card) rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={64} className="animate-spin text-primary-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-(--text) mb-2">Verifying Payment</h1>
            <p className="text-(--text-muted)">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <Sparkles size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">Room Featured Successfully!</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            
            {featuredData && (
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-(--text-muted)">Duration:</span>
                    <span className="font-semibold">{featuredData.days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--text-muted)">Expires:</span>
                    <span className="font-semibold">
                      {new Date(featuredData.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--text-muted)">Amount Paid:</span>
                    <span className="font-semibold">
                      {featuredData.currency} {featuredData.amount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
                View Featured Rooms
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/rooms?roomId=${params.roomId}`)}>
                Go to My Room
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">Payment Failed</h1>
            <p className="text-(--text-muted) mb-6">{message}</p>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
                Back to Rooms
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                Try Again
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
