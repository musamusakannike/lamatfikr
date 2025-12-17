"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  ChevronRight,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type OrderStatus = Order["status"];
type OrderType = "bought" | "sold";

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

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>("bought");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await marketplaceApi.getMyOrders({
        page,
        limit: 10,
        type: orderType,
        status: statusFilter || undefined,
      });
      setOrders(response.orders);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, orderType, statusFilter]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [orderType, statusFilter]);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.items.some((item) => item.title.toLowerCase().includes(query))
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">My Orders</h1>
              <p className="text-(--text-muted)">
                View and manage your orders
              </p>
            </div>
            <Link href="/marketplace">
              <Button variant="outline">
                <ShoppingBag size={18} className="mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Order Type Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            <button
              onClick={() => setOrderType("bought")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                orderType === "bought"
                  ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              <ShoppingBag size={16} className="inline mr-2" />
              Purchases
            </button>
            <button
              onClick={() => setOrderType("sold")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                orderType === "sold"
                  ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              <Package size={16} className="inline mr-2" />
              Sales
            </button>
          </div>

          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order number or product..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-primary-50 dark:bg-primary-900/20")}
              >
                <Filter size={18} className="mr-2" />
                Filters
              </Button>

              {/* Refresh */}
              <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
                <RefreshCw size={18} className={cn("mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-(--border)">
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        statusFilter === filter.value
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-(--text-muted) hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-(--text) mb-2">
                No orders found
              </h2>
              <p className="text-(--text-muted) mb-6">
                {orderType === "bought"
                  ? "You haven't made any purchases yet."
                  : "You haven't received any orders yet."}
              </p>
              {orderType === "bought" && (
                <Link href="/marketplace">
                  <Button variant="primary">
                    <ShoppingBag size={18} className="mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={order._id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-(--border)">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <Package size={20} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-(--text)">
                              Order #{order.orderNumber}
                            </p>
                            <p className="text-sm text-(--text-muted)">
                              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig.color}>
                            <StatusIcon size={14} className="mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-(--text-muted)">
                            {order.paymentMethod === "tap" ? (
                              <>
                                <CreditCard size={14} />
                                <span>Card</span>
                              </>
                            ) : (
                              <>
                                <Banknote size={14} />
                                <span>Cash</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
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
                              <p className="font-medium text-(--text) line-clamp-1">
                                {item.title}
                              </p>
                              <p className="text-sm text-(--text-muted)">
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-(--text)">
                              ${(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-(--text-muted)">
                            +{order.items.length - 2} more item(s)
                          </p>
                        )}
                      </div>

                      {/* Order Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-(--border)">
                        <div>
                          <p className="text-sm text-(--text-muted)">
                            {orderType === "bought" ? "Seller" : "Buyer"}:{" "}
                            <span className="font-medium text-(--text)">
                              {orderType === "bought"
                                ? order.sellerId.displayName || order.sellerId.username
                                : order.buyerId.displayName || order.buyerId.username}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-(--text-muted)">Total</p>
                            <p className="font-bold text-lg text-primary-600">
                              ${order.total.toFixed(2)}
                            </p>
                          </div>
                          <Link href={`/marketplace/orders/${order._id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                              <ChevronRight size={16} className="ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-(--text-muted)">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
