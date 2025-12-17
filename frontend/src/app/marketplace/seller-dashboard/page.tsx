"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi, SellerStats, Order } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import {
  Package,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart3,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Users,
  Star,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AddProductModal, ProductFormData as AddProductFormData } from "@/components/marketplace/AddProductModal";

export default function SellerDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<SellerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await marketplaceApi.getSellerStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchRecentOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingOrders(true);
    try {
      const response = await marketplaceApi.getMyOrders({
        type: "sold",
        limit: 5,
      });
      setRecentOrders(response.orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, [fetchStats, fetchRecentOrders]);

  const handleAddProduct = async (formData: AddProductFormData) => {
    try {
      await marketplaceApi.createProduct({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        images: formData.images,
        category: formData.category,
        quantity: formData.inStock ? 1 : 0,
      });
      toast.success("Product created successfully");
      fetchStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create product");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "awaiting_payment":
        return <Clock size={14} className="text-yellow-500" />;
      case "paid":
      case "processing":
        return <Package size={14} className="text-blue-500" />;
      case "shipped":
        return <Truck size={14} className="text-purple-500" />;
      case "delivered":
      case "completed":
        return <CheckCircle size={14} className="text-green-500" />;
      case "cancelled":
      case "refunded":
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-gray-500" />;
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const orderStats = stats?.orders || {};
  const pendingCount = (orderStats.pending?.count || 0) + (orderStats.awaiting_payment?.count || 0);
  const processingCount = (orderStats.paid?.count || 0) + (orderStats.processing?.count || 0);
  const shippedCount = orderStats.shipped?.count || 0;
  const completedCount = (orderStats.delivered?.count || 0) + (orderStats.completed?.count || 0);

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">Seller Dashboard</h1>
              <p className="text-(--text-muted)">
                Overview of your sales and performance
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { fetchStats(); fetchRecentOrders(); }}>
                <RefreshCw size={18} className="mr-2" />
                Refresh
              </Button>
              <Link href="/marketplace/my-listings">
                <Button variant="primary">
                  <Package size={18} className="mr-2" />
                  My Listings
                </Button>
              </Link>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-(--text-muted) mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-(--text)">
                    ${stats?.revenue.total.toFixed(2) || "0.00"}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                    <ArrowUpRight size={14} />
                    <span>+12.5%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <DollarSign size={24} className="text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-(--text-muted) mb-1">Completed Orders</p>
                  <p className="text-2xl font-bold text-(--text)">
                    {stats?.revenue.completedOrders || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                    <ArrowUpRight size={14} />
                    <span>+8.2%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <ShoppingBag size={24} className="text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-(--text-muted) mb-1">Active Products</p>
                  <p className="text-2xl font-bold text-(--text)">
                    {stats?.products.active || 0}
                  </p>
                  <p className="text-sm text-(--text-muted) mt-2">
                    of {stats?.products.total || 0} total
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Package size={24} className="text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-(--text-muted) mb-1">Products Sold</p>
                  <p className="text-2xl font-bold text-(--text)">
                    {stats?.products.sold || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                    <ArrowDownRight size={14} />
                    <span>-2.4%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                  <TrendingUp size={24} className="text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Order Status Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-(--text) mb-4">Order Status Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingCount}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Awaiting action</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-400">Processing</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{processingCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Being prepared</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={18} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-400">Shipped</span>
                </div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{shippedCount}</p>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">In transit</p>
              </div>

              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-400">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completedCount}</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Successfully delivered</p>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-(--text)">Recent Orders</h2>
                <Link href="/marketplace/orders?type=sold">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary-600" />
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-(--text-muted)">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      href={`/marketplace/orders/${order._id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                        {order.items[0]?.image ? (
                          <img
                            src={order.items[0].image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-(--text) line-clamp-1">
                          {order.items[0]?.title || "Order"}
                          {order.items.length > 1 && ` +${order.items.length - 1}`}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {order.buyerId.displayName || order.buyerId.username}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-(--text)">
                          ${order.total.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-(--text-muted)">
                          {getOrderStatusIcon(order.status)}
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions & Tips */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-(--text) mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="w-full text-left flex items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/50">
                    <Package size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-(--text)">Add New Product</p>
                    <p className="text-sm text-(--text-muted)">List a new item for sale</p>
                  </div>
                </button>

                <Link
                  href="/marketplace/orders?type=sold&status=paid"
                  className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-(--text)">Process Orders</p>
                    <p className="text-sm text-(--text-muted)">
                      {processingCount} orders need attention
                    </p>
                  </div>
                </Link>

                <Link
                  href="/marketplace/my-listings"
                  className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <BarChart3 size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-(--text)">Manage Listings</p>
                    <p className="text-sm text-(--text-muted)">
                      {stats?.products.active || 0} active products
                    </p>
                  </div>
                </Link>
              </div>

              {/* Performance Tips */}
              <div className="mt-6 pt-6 border-t border-(--border)">
                <h3 className="text-sm font-semibold text-(--text) mb-3">Performance Tips</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Star size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                    <p className="text-(--text-muted)">
                      Respond to orders within 24 hours to maintain a high seller rating
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Eye size={14} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-(--text-muted)">
                      Add multiple high-quality images to increase product visibility
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Users size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-(--text-muted)">
                      Engage with buyers to build trust and encourage repeat purchases
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
}
