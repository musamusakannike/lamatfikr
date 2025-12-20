"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi, ShippingAddress } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  Loader2,
  ShoppingBag,
  CheckCircle,
  Truck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PaymentMethod = "tap";

export default function CheckoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();
  const { cart, isLoading: isCartLoading, fetchCart, clearCart } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tap");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyerNotes, setBuyerNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const subtotal = cart?.subtotal || 0;
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!shippingAddress.fullName.trim()) {
      toast.error(t("marketplace", "pleaseEnterFullName"));
      return false;
    }
    if (!shippingAddress.phone.trim()) {
      toast.error(t("marketplace", "pleaseEnterPhone"));
      return false;
    }
    if (!shippingAddress.addressLine1.trim()) {
      toast.error(t("marketplace", "pleaseEnterAddress"));
      return false;
    }
    if (!shippingAddress.city.trim()) {
      toast.error(t("marketplace", "pleaseEnterCity"));
      return false;
    }
    if (!shippingAddress.country.trim()) {
      toast.error(t("marketplace", "pleaseEnterCountry"));
      return false;
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    if (!cart || cart.items.length === 0) {
      toast.error(t("marketplace", "yourCartIsEmpty"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await marketplaceApi.createOrderFromCart({
        shippingAddress,
        paymentMethod,
        buyerNotes: buyerNotes.trim() || undefined,
      });

      if (paymentMethod === "tap" && response.orders.length > 0) {
        // Initiate payment for the first order
        const paymentResponse = await marketplaceApi.initiatePayment(response.orders[0]._id);
        window.location.href = paymentResponse.redirectUrl;
      } else {
        toast.success(t("marketplace", "orderPlacedSuccessfully"));
        await clearCart();
        router.push("/marketplace/orders");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("marketplace", "failedToPlaceOrder"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
          <div className="max-w-4xl mx-auto p-4">
            <Card className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={40} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-(--text) mb-2">
                {t("marketplace", "cartEmpty")}
              </h2>
              <p className="text-(--text-muted) mb-6">
                {t("marketplace", "cartEmptyDescription")}
              </p>
              <Link href="/marketplace">
                <Button variant="primary">
                  <ShoppingBag size={18} className="mr-2" />
                  {t("marketplace", "browseProducts")}
                </Button>
              </Link>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-(--text)">{t("marketplace", "checkout")}</h1>
              <p className="text-(--text-muted)">
                {t("marketplace", "completeYourOrder")
                  .replace("{count}", String(cart.itemCount))}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <MapPin size={20} className="text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-(--text)">
                    {t("marketplace", "shippingAddress")}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "fullName")} *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder={t("marketplace", "fullNamePlaceholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "phoneNumber")} *
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder={t("marketplace", "phonePlaceholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "country")} *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      placeholder={t("marketplace", "countryPlaceholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "addressLine1")} *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                      placeholder={t("marketplace", "addressLine1Placeholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "addressLine2")}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                      placeholder={t("marketplace", "addressLine2Placeholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "city")} *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder={t("marketplace", "city")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "stateOrProvince")}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder={t("marketplace", "stateOrProvince")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("marketplace", "postalCode")}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      placeholder={t("marketplace", "postalCode")}
                      className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <CreditCard size={20} className="text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-(--text)">
                    {t("marketplace", "paymentMethod")}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod("tap")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      paymentMethod === "tap"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-(--border) hover:border-primary-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          paymentMethod === "tap"
                            ? "bg-primary-100 dark:bg-primary-900/50"
                            : "bg-gray-100 dark:bg-gray-800"
                        )}
                      >
                        <CreditCard
                          size={24}
                          className={
                            paymentMethod === "tap"
                              ? "text-primary-600"
                              : "text-gray-500"
                          }
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-(--text)">
                          {t("marketplace", "onlinePayment")}
                        </p>
                        <p className="text-sm text-(--text-muted)">
                          {t("marketplace", "payWithCardViaTap")}
                        </p>
                      </div>
                      {paymentMethod === "tap" && (
                        <CheckCircle
                          size={20}
                          className="ml-auto text-primary-600"
                        />
                      )}
                    </div>
                  </button>
                </div>
              </Card>

              {/* Order Notes */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <Package size={20} className="text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-(--text)">
                    {t("marketplace", "orderNotesOptional")}
                  </h2>
                </div>

                <textarea
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder={t("marketplace", "orderNotesPlaceholder")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <Card className="p-6 sticky top-20">
                <h2 className="text-lg font-semibold text-(--text) mb-4">
                  {t("marketplace", "orderSummary")}
                </h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-(--text) line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {t("marketplace", "qtyShort")}: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 py-4 border-t border-(--border)">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-muted)">{t("marketplace", "subtotal")}</span>
                    <span className="text-(--text)">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-muted)">{t("marketplace", "shipping")}</span>
                    <span className="text-green-600 font-medium">{t("marketplace", "free")}</span>
                  </div>
                </div>

                <div className="flex justify-between py-4 border-t border-(--border)">
                  <span className="font-semibold text-(--text)">{t("marketplace", "total")}</span>
                  <span className="font-bold text-xl text-primary-600">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Place Order Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="mr-2 animate-spin" />
                      {t("marketplace", "processing")}
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} className="mr-2" />
                      {t("marketplace", "pay")} ${total.toFixed(2)}
                    </>
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-(--border)">
                  <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                    <Shield size={16} className="text-green-500" />
                    <span>{t("marketplace", "secureCheckout")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                    <Truck size={16} className="text-blue-500" />
                    <span>{t("marketplace", "freeShipping")}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
