"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi, Order } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import {
  Package,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  MapPin,
  User,
  Phone,
  Mail,
  RefreshCw,
  Copy,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type OrderStatus = Order["status"];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: CreditCard },
  paid: { label: "Paid", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Package },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: RefreshCw },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
};

const ORDER_TIMELINE: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "completed",
];

export default function OrderDetailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: t("marketplace", "statusPending"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    awaiting_payment: { label: t("marketplace", "statusAwaitingPayment"), color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: CreditCard },
    paid: { label: t("marketplace", "statusPaid"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
    processing: { label: t("marketplace", "statusProcessing"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Package },
    shipped: { label: t("marketplace", "statusShipped"), color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Truck },
    delivered: { label: t("marketplace", "statusDelivered"), color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", icon: CheckCircle },
    completed: { label: t("marketplace", "statusCompleted"), color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
    cancelled: { label: t("marketplace", "statusCancelled"), color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
    refunded: { label: t("marketplace", "statusRefunded"), color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: RefreshCw },
    disputed: { label: t("marketplace", "statusDisputed"), color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  
  // Seller management state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!isAuthenticated || !orderId) return;

    setIsLoading(true);
    try {
      const response = await marketplaceApi.getOrder(orderId);
      setOrder(response.order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error(t("marketplace", "failedToLoadOrderDetails"));
      router.push("/marketplace/orders");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, orderId, router]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      await marketplaceApi.cancelOrder(order._id, cancelReason);
      toast.success(t("marketplace", "orderCancelledSuccessfully"));
      setShowCancelModal(false);
      fetchOrder();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("marketplace", "failedToCancelOrder"));
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;

    try {
      const response = await marketplaceApi.initiatePayment(order._id);
      window.location.href = response.redirectUrl;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("marketplace", "failedToInitiatePayment"));
    }
  };

  const handleUpdateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    setIsUpdatingStatus(true);
    try {
      await marketplaceApi.updateOrderStatus(order._id, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
        sellerNotes: sellerNotes || undefined,
      });
      toast.success(`${t("marketplace", "orderDetails")}: ${STATUS_CONFIG[newStatus].label}`);
      setShowUpdateModal(false);
      setTrackingNumber("");
      setSellerNotes("");
      fetchOrder();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("marketplace", "failedToUpdateOrderStatus"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getNextSellerAction = (): { status: OrderStatus; label: string; icon: React.ElementType } | null => {
    if (!order || !isSeller) return null;
    
    switch (order.status) {
      case "paid":
        return { status: "processing", label: t("marketplace", "statusProcessing"), icon: Package };
      case "processing":
        return { status: "shipped", label: t("marketplace", "statusShipped"), icon: Truck };
      case "shipped":
        return { status: "delivered", label: t("marketplace", "statusDelivered"), icon: CheckCircle };
      case "delivered":
        return { status: "completed", label: t("marketplace", "statusCompleted"), icon: CheckCircle };
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("marketplace", "copiedToClipboard"));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isBuyer = order?.buyerId._id === user?.id;
  const isSeller = order?.sellerId._id === user?.id;

  const canCancel = order && ["pending", "awaiting_payment", "paid"].includes(order.status) && isBuyer;

  const getTimelineStatus = (status: OrderStatus) => {
    if (!order) return "pending";
    const currentIndex = ORDER_TIMELINE.indexOf(order.status);
    const statusIndex = ORDER_TIMELINE.indexOf(status);

    if (order.status === "cancelled" || order.status === "refunded" || order.status === "disputed") {
      return "cancelled";
    }

    if (statusIndex < currentIndex) return "completed";
    if (statusIndex === currentIndex) return "current";
    return "pending";
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Package size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-(--text) mb-2">{t("marketplace", "orderNotFound")}</h2>
          <p className="text-(--text-muted) mb-4">{t("marketplace", "orderNotFoundDescription")}</p>
          <Link href="/marketplace/orders">
            <Button variant="primary">{t("marketplace", "backToOrders")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-5xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/marketplace/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-(--text)">
                  {t("marketplace", "orderNumber")} {order.orderNumber}
                </h1>
                <button
                  onClick={() => copyToClipboard(order.orderNumber)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Copy size={16} className="text-(--text-muted)" />
                </button>
              </div>
              <p className="text-(--text-muted)">
                {t("marketplace", "placedOn")} {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge className={cn("text-sm py-1.5 px-3", statusConfig.color)}>
              <StatusIcon size={16} className="mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Timeline */}
              {!["cancelled", "refunded", "disputed"].includes(order.status) && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-(--text) mb-6">{t("marketplace", "orderProgress")}</h2>
                  <div className="flex items-center justify-between">
                    {ORDER_TIMELINE.slice(0, 5).map((status, index) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const timelineStatus = getTimelineStatus(status);

                      return (
                        <div key={status} className="flex flex-col items-center relative flex-1">
                          {index > 0 && (
                            <div
                              className={cn(
                                "absolute top-5 right-1/2 w-full h-0.5",
                                timelineStatus === "completed" || timelineStatus === "current"
                                  ? "bg-primary-500"
                                  : "bg-gray-200 dark:bg-gray-700"
                              )}
                            />
                          )}
                          <div
                            className={cn(
                              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center",
                              timelineStatus === "completed"
                                ? "bg-primary-500 text-white"
                                : timelineStatus === "current"
                                ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 ring-2 ring-primary-500"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}
                          >
                            <Icon size={18} />
                          </div>
                          <span
                            className={cn(
                              "mt-2 text-xs font-medium text-center",
                              timelineStatus === "current"
                                ? "text-primary-600"
                                : "text-(--text-muted)"
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Order Items */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-(--text) mb-4">{t("marketplace", "orderItems")}</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-(--text) line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-(--text-muted) mt-1">
                          {t("marketplace", "quantity")}: {item.quantity}
                        </p>
                        <p className="text-sm text-(--text-muted)">
                          {t("marketplace", "unitPrice")}: ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-(--text)">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t border-(--border) space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-muted)">{t("marketplace", "subtotal")}</span>
                    <span className="text-(--text)">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-muted)">{t("marketplace", "shipping")}</span>
                    <span className="text-(--text)">
                      {order.shippingFee === 0 ? (
                        <span className="text-green-600">{t("marketplace", "free")}</span>
                      ) : (
                        `$${order.shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {order.serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-(--text-muted)">{t("marketplace", "serviceFee")}</span>
                      <span className="text-(--text)">${order.serviceFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-(--border)">
                    <span className="font-semibold text-(--text)">{t("marketplace", "total")}</span>
                    <span className="font-bold text-xl text-primary-600">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {(order.buyerNotes || order.sellerNotes || order.notes) && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-(--text) mb-4">{t("marketplace", "notes")}</h2>
                  <div className="space-y-3">
                    {order.buyerNotes && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">
                          {t("marketplace", "buyerNotes")}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {order.buyerNotes}
                        </p>
                      </div>
                    )}
                    {order.sellerNotes && (
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-400 mb-1">
                          {t("marketplace", "sellerNotes")}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {order.sellerNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-(--text) mb-4">{t("marketplace", "actions")}</h2>
                <div className="space-y-3">
                  {order.status === "awaiting_payment" && isBuyer && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handlePayNow}
                    >
                      <CreditCard size={18} className="mr-2" />
                      {t("marketplace", "payNow")}
                    </Button>
                  )}

                  {/* Seller Actions */}
                  {isSeller && getNextSellerAction() && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowUpdateModal(true)}
                    >
                      {(() => {
                        const action = getNextSellerAction();
                        if (!action) return null;
                        const ActionIcon = action.icon;
                        return (
                          <>
                            <ActionIcon size={18} className="mr-2" />
                            {action.label}
                          </>
                        );
                      })()}
                    </Button>
                  )}

                  <Button variant="outline" className="w-full">
                    <MessageCircle size={18} className="mr-2" />
                    {t("marketplace", "contact")} {isBuyer ? t("marketplace", "seller") : t("marketplace", "buyer")}
                  </Button>

                  {canCancel && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setShowCancelModal(true)}
                    >
                      <XCircle size={18} className="mr-2" />
                      {t("marketplace", "cancelOrder")}
                    </Button>
                  )}
                </div>
              </Card>

              {/* Payment Info */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-(--text) mb-4">{t("marketplace", "payment")}</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {order.paymentMethod === "tap" ? (
                      <CreditCard size={20} className="text-primary-600" />
                    ) : (
                      <Banknote size={20} className="text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-(--text)">
                        {order.paymentMethod === "tap" ? t("marketplace", "onlinePayment") : t("marketplace", "cashOnDelivery")}
                      </p>
                      {order.paidAt && (
                        <p className="text-sm text-(--text-muted)">
                          {t("marketplace", "paidOn")} {formatDate(order.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-(--text) mb-4">
                    {t("marketplace", "shippingAddress")}
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User size={16} className="text-(--text-muted) mt-0.5" />
                      <p className="text-(--text)">{order.shippingAddress.fullName}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone size={16} className="text-(--text-muted) mt-0.5" />
                      <p className="text-(--text)">{order.shippingAddress.phone}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-(--text-muted) mt-0.5" />
                      <div className="text-(--text)">
                        <p>{order.shippingAddress.addressLine1}</p>
                        {order.shippingAddress.addressLine2 && (
                          <p>{order.shippingAddress.addressLine2}</p>
                        )}
                        <p>
                          {order.shippingAddress.city}
                          {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                          {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Tracking */}
              {order.trackingNumber && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-(--text) mb-4">{t("marketplace", "tracking")}</h2>
                  <div className="flex items-center gap-2">
                    <Truck size={20} className="text-primary-600" />
                    <p className="font-medium text-(--text)">{order.trackingNumber}</p>
                    <button
                      onClick={() => copyToClipboard(order.trackingNumber!)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <Copy size={14} className="text-(--text-muted)" />
                    </button>
                  </div>
                </Card>
              )}

              {/* Seller/Buyer Info */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-(--text) mb-4">
                  {isBuyer ? t("marketplace", "seller") : t("marketplace", "buyer")} {t("marketplace", "information")}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {(isBuyer ? order.sellerId.avatar : order.buyerId.avatar) ? (
                      <img
                        src={isBuyer ? order.sellerId.avatar : order.buyerId.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-(--text)">
                      {isBuyer
                        ? order.sellerId.displayName || order.sellerId.username
                        : order.buyerId.displayName || order.buyerId.username}
                    </p>
                    <p className="text-sm text-(--text-muted)">
                      @{isBuyer ? order.sellerId.username : order.buyerId.username}
                    </p>
                  </div>
                </div>
                {(isBuyer ? order.sellerId.email : order.buyerId.email) && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-(--text-muted)">
                    <Mail size={14} />
                    <span>{isBuyer ? order.sellerId.email : order.buyerId.email}</span>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <Card className="relative z-10 w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-(--text) mb-4">
              {t("marketplace", "cancelOrderTitle")}
            </h2>
            <p className="text-(--text-muted) mb-4">
              {t("marketplace", "cancelOrderConfirm")}
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("marketplace", "cancelReasonPlaceholder")}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                {t("marketplace", "keepOrder")}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {t("marketplace", "cancelling")}
                  </>
                ) : (
                  t("marketplace", "cancelOrder")
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Update Order Status Modal (Seller) */}
      {showUpdateModal && getNextSellerAction() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpdateModal(false)}
          />
          <Card className="relative z-10 w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-(--text) mb-4">
              {getNextSellerAction()?.label}
            </h2>
            <p className="text-(--text-muted) mb-4">
              {t("marketplace", "status")}: {STATUS_CONFIG[getNextSellerAction()!.status].label}
            </p>

            {/* Tracking Number (for shipping) */}
            {getNextSellerAction()?.status === "shipped" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  {t("marketplace", "trackingNumber")}
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t("marketplace", "trackingNumberPlaceholder")}
                  className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Seller Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-(--text) mb-1.5">
                {t("marketplace", "notesForBuyerOptional")}
              </label>
              <textarea
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                placeholder={t("marketplace", "notesForBuyerPlaceholder")}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowUpdateModal(false);
                  setTrackingNumber("");
                  setSellerNotes("");
                }}
              >
                {t("common", "cancel")}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleUpdateOrderStatus(getNextSellerAction()!.status)}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {t("marketplace", "updating")}
                  </>
                ) : (
                  t("marketplace", "confirm")
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
