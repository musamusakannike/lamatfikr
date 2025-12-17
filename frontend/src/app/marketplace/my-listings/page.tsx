"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi, Product, SellerStats } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import {
  Package,
  Loader2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart3,
  RefreshCw,
  Star,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AddProductModal, ProductFormData as AddProductFormData } from "@/components/marketplace/AddProductModal";

type ProductStatus = "active" | "sold" | "reserved" | "inactive";

const getStatusConfig = (t: (section: string, key: string) => string): Record<ProductStatus, { label: string; color: string }> => ({
  active: { label: t("myListings", "active"), color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  sold: { label: t("myListings", "sold"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  reserved: { label: t("myListings", "reserved"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  inactive: { label: t("myListings", "inactive"), color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
});

const getStatusFilters = (t: (section: string, key: string) => string): { value: string; label: string }[] => [
  { value: "", label: t("myListings", "allProducts") },
  { value: "active", label: t("myListings", "active") },
  { value: "sold", label: t("myListings", "sold") },
  { value: "reserved", label: t("myListings", "reserved") },
  { value: "inactive", label: t("myListings", "inactive") },
];

export default function MyListingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await marketplaceApi.getMyProducts({
        page,
        limit: 12,
        status: statusFilter || undefined,
      });
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error(t("myListings", "failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, statusFilter]);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingStats(true);
    try {
      const response = await marketplaceApi.getSellerStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProduct(productId);
    try {
      await marketplaceApi.deleteProduct(productId);
      toast.success(t("myListings", "productDeleted"));
      fetchProducts();
      fetchStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("myListings", "failedToDelete"));
    } finally {
      setDeletingProduct(null);
      setActiveMenu(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    try {
      await marketplaceApi.updateProduct(product._id, { status: newStatus } as never);
      toast.success(newStatus === "active" ? t("myListings", "productActivated") : t("myListings", "productDeactivated"));
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("myListings", "failedToUpdate"));
    }
    setActiveMenu(null);
  };

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
      toast.success(t("myListings", "productCreated"));
      fetchProducts();
      fetchStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("myListings", "failedToCreate"));
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
  });

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
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">{t("myListings", "title")}</h1>
              <p className="text-(--text-muted)">
                {t("myListings", "manageProducts")}
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowAddProduct(true)}>
              <Plus size={18} className="mr-2" />
              {t("myListings", "addNewProduct")}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-(--text-muted)">{t("myListings", "totalProducts")}</p>
                  <p className="text-xl font-bold text-(--text)">
                    {isLoadingStats ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      stats?.products.total || 0
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-(--text-muted)">{t("myListings", "active")}</p>
                  <p className="text-xl font-bold text-(--text)">
                    {isLoadingStats ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      stats?.products.active || 0
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <ShoppingBag size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-(--text-muted)">{t("myListings", "sold")}</p>
                  <p className="text-xl font-bold text-(--text)">
                    {isLoadingStats ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      stats?.products.sold || 0
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <DollarSign size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-(--text-muted)">{t("myListings", "revenue")}</p>
                  <p className="text-xl font-bold text-(--text)">
                    {isLoadingStats ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      `$${stats?.revenue.total.toFixed(2) || "0.00"}`
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("myListings", "searchProducts")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-primary-50 dark:bg-primary-900/20")}
              >
                <Filter size={18} className="mr-2" />
                {t("myListings", "filters")}
              </Button>

              <Button variant="outline" onClick={() => { fetchProducts(); fetchStats(); }} disabled={isLoading}>
                <RefreshCw size={18} className={cn("mr-2", isLoading && "animate-spin")} />
                {t("myListings", "refresh")}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-(--border)">
                <div className="flex flex-wrap gap-2">
                  {getStatusFilters(t).map((filter) => (
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

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-(--text) mb-2">
                {t("myListings", "noProductsFound")}
              </h2>
              <p className="text-(--text-muted) mb-6">
                {statusFilter
                  ? t("myListings", "noProductsMatchFilter")
                  : t("myListings", "noProductsListed")}
              </p>
              <Button variant="primary" onClick={() => setShowAddProduct(true)}>
                <Plus size={18} className="mr-2" />
                {t("myListings", "addFirstProduct")}
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product._id} className="overflow-hidden group">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={product.images[0] || "https://via.placeholder.com/400"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge
                        className={cn(
                          "absolute top-2 left-2",
                          getStatusConfig(t)[product.status as ProductStatus]?.color
                        )}
                      >
                        {getStatusConfig(t)[product.status as ProductStatus]?.label}
                      </Badge>

                      {/* Actions Menu */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => setActiveMenu(activeMenu === product._id ? null : product._id)}
                          className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenu === product._id && (
                          <div className="absolute right-0 mt-1 w-40 bg-(--bg-card) rounded-lg shadow-lg border border-(--border) py-1 z-10">
                            <Link
                              href={`/marketplace/edit-product/${product._id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-(--text) hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Edit size={14} />
                              {t("myListings", "edit")}
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(product)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-(--text) hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                            >
                              {product.status === "active" ? (
                                <>
                                  <EyeOff size={14} />
                                  {t("myListings", "deactivate")}
                                </>
                              ) : (
                                <>
                                  <Eye size={14} />
                                  {t("myListings", "activate")}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              disabled={deletingProduct === product._id}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                            >
                              {deletingProduct === product._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              {t("myListings", "delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-medium text-(--text) line-clamp-2 mb-2">
                        {product.title}
                      </h3>
                      <p className="text-lg font-bold text-primary-600 mb-3">
                        ${product.price.toFixed(2)}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-(--text-muted)">
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{product.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          <span>{product.favoriteCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={14} />
                          <span>{product.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="mt-3 pt-3 border-t border-(--border)">
                        <p className="text-sm text-(--text-muted)">
                          {t("myListings", "stock")}: <span className="font-medium text-(--text)">{product.quantity}</span>
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {t("myListings", "previous")}
                  </Button>
                  <span className="px-4 py-2 text-sm text-(--text-muted)">
                    {t("myListings", "pageOf").replace("{page}", String(page)).replace("{total}", String(totalPages))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    {t("myListings", "next")}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Quick Stats Link */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <BarChart3 size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-(--text)">{t("myListings", "viewDetailedAnalytics")}</h3>
                  <p className="text-sm text-(--text-muted)">
                    {t("myListings", "comprehensiveStats")}
                  </p>
                </div>
              </div>
              <Link href="/marketplace/seller-dashboard">
                <Button variant="outline">
                  {t("myListings", "viewDashboard")}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}

      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
}
