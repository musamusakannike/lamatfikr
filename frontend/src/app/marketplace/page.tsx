"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ProductCard,
  ProductDetailsModal,
  AddProductModal,
  Product,
} from "@/components/marketplace";
import { marketplaceApi, MarketplaceStats } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Grid,
  List,
  SlidersHorizontal,
  ShoppingBag,
  LayoutDashboard,
  TrendingUp,
  Package,
  DollarSign,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormData as AddProductFormData } from "@/components/marketplace/AddProductModal";

const categories = ["All", "Electronics", "Clothing", "Accessories", "Home & Garden", "Sports", "Books", "Beauty", "Toys", "Automotive", "Food & Beverages", "Other"];

export default function MarketplacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketplaceApi.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: searchQuery || undefined,
        sortBy: sortBy === "featured" ? "createdAt" : sortBy === "price-low" || sortBy === "price-high" ? "price" : sortBy,
        sortOrder: sortBy === "price-low" ? "asc" : sortBy === "price-high" ? "desc" : sortOrder,
      });
      setProducts(response.products as unknown as Product[]);
      setPagination(response.pagination);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedCategory, searchQuery, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await marketplaceApi.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
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
        quantity: formData.quantity,
      });
      toast.success("Product created successfully");
      fetchProducts();
      fetchStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create product");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">{t("marketplace", "title")}</h1>
              <p className="text-(--text-muted)">{t("marketplace", "discoverProducts")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => (window.location.href = "/marketplace/my-listings")}>
                <LayoutDashboard size={18} className={isRTL ? "ml-2" : "mr-2"} />
                {t("marketplace", "manage")}
              </Button>
              <Button variant="primary" onClick={() => setShowAddProduct(true)}>
                <Plus size={18} className={isRTL ? "ml-2" : "mr-2"} />
                {t("marketplace", "addProduct")}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <Package size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-(--text)">{stats?.totalProducts || 0}</p>
                  <p className="text-sm text-(--text-muted)">{t("marketplace", "totalProducts")}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <ShoppingBag size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-(--text)">{stats?.inStock || 0}</p>
                  <p className="text-sm text-(--text-muted)">{t("marketplace", "inStock")}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <TrendingUp size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-(--text)">{stats?.featured || 0}</p>
                  <p className="text-sm text-(--text-muted)">{t("marketplace", "featured")}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-(--text)">${stats?.avgPrice || "0.00"}</p>
                  <p className="text-sm text-(--text-muted)">{t("marketplace", "avgPrice")}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder={t("marketplace", "searchProducts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </form>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedCategory === category
                        ? "bg-primary-600 text-white"
                        : "bg-primary-50 dark:bg-primary-900/30 text-(--text) hover:bg-primary-100 dark:hover:bg-primary-900/50"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort and View Options */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-(--border)">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-(--text-muted)" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-(--border) bg-(--bg-card) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="featured">{t("marketplace", "sortFeatured")}</option>
                  <option value="createdAt">{t("marketplace", "sortNewest")}</option>
                  <option value="price-low">{t("marketplace", "sortPriceLow")}</option>
                  <option value="price-high">{t("marketplace", "sortPriceHigh")}</option>
                  <option value="rating">{t("marketplace", "sortTopRated")}</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm text-(--text-muted) mr-2">
                  {pagination.total} {t("marketplace", "productsCount")}
                </span>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600"
                      : "text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30"
                  )}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    viewMode === "list"
                      ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600"
                      : "text-(--text-muted) hover:bg-primary-50 dark:hover:bg-primary-900/30"
                  )}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div
                className={cn(
                  "grid gap-4",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                )}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    {t("marketplace", "previous")}
                  </Button>
                  <span className="text-sm text-(--text-muted)">
                    {t("marketplace", "pageOf").replace("{page}", String(pagination.page)).replace("{total}", String(pagination.totalPages))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    {t("marketplace", "next")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <ShoppingBag size={48} className="mx-auto text-(--text-muted) mb-4" />
              <h3 className="text-lg font-semibold text-(--text) mb-2">{t("marketplace", "noProductsFound")}</h3>
              <p className="text-(--text-muted) mb-4">
                {t("marketplace", "tryAdjustingSearch")}
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                {t("marketplace", "clearFilters")}
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={showProductDetails}
        onClose={() => setShowProductDetails(false)}
        product={selectedProduct}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
}
