"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { getErrorMessage } from "@/lib/api";
import { Loader2, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get("orderId");
      const tapId = searchParams.get("tap_id");

      if (!orderId || !tapId) {
        setStatus("error");
        setMessage("Missing payment information. Please try again.");
        return;
      }

      try {
        const response = await marketplaceApi.verifyPayment(orderId, tapId);
        setStatus("success");
        setMessage(response.message || "Payment successful! Your order has been placed.");
        setOrderNumber(response.order?.orderNumber || null);
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
            <h1 className="text-2xl font-bold text-(--text) mb-2">Verifying Payment</h1>
            <p className="text-(--text-muted)">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-(--text) mb-2">Payment Successful!</h1>
            <p className="text-(--text-muted) mb-2">{message}</p>
            {orderNumber && (
              <p className="text-sm text-(--text-muted) mb-6">
                Order Number: <span className="font-semibold text-(--text)">{orderNumber}</span>
              </p>
            )}
            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={() => router.push("/marketplace/orders")}>
                <ShoppingBag size={18} className="mr-2" />
                View My Orders
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/marketplace")}>
                Continue Shopping
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
              <Button variant="primary" className="w-full" onClick={() => router.push("/marketplace")}>
                Back to Marketplace
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

export default function MarketplacePaymentCallbackPage() {
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
