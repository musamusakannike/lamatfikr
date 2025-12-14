"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ProductCard,
  ProductDetailsModal,
  AddProductModal,
  Product,
  ProductFormData,
} from "@/components/marketplace";
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  ChevronDown,
  ShoppingBag,
  TrendingUp,
  Package,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy products data
const dummyProducts: Product[] = [
  {
    id: "1",
    title: "Premium Wireless Headphones with Noise Cancellation",
    description: "High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality.",
    price: 199.99,
    originalPrice: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Electronics",
    rating: 4.8,
    reviews: 256,
    seller: {
      name: "TechStore Pro",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      verified: true,
    },
    inStock: true,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "2",
    title: "Organic Cotton T-Shirt - Classic Fit",
    description: "Comfortable organic cotton t-shirt made with sustainable materials. Available in multiple colors.",
    price: 29.99,
    originalPrice: 45.00,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    category: "Clothing",
    rating: 4.5,
    reviews: 189,
    seller: {
      name: "EcoWear",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      verified: true,
    },
    inStock: true,
    isNew: false,
  },
  {
    id: "3",
    title: "Smart Watch Series X - Fitness Tracker",
    description: "Advanced smartwatch with heart rate monitoring, GPS, and 7-day battery life.",
    price: 349.00,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Electronics",
    rating: 4.7,
    reviews: 432,
    seller: {
      name: "GadgetHub",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
    inStock: true,
    isFeatured: true,
  },
  {
    id: "4",
    title: "Vintage Leather Messenger Bag",
    description: "Handcrafted genuine leather messenger bag with multiple compartments. Perfect for work or travel.",
    price: 89.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    category: "Accessories",
    rating: 4.6,
    reviews: 98,
    seller: {
      name: "LeatherCraft",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      verified: false,
    },
    inStock: true,
  },
  {
    id: "5",
    title: "Professional Camera Lens 50mm f/1.8",
    description: "High-quality prime lens for stunning portraits and low-light photography.",
    price: 449.00,
    image: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=400&fit=crop",
    category: "Electronics",
    rating: 4.9,
    reviews: 167,
    seller: {
      name: "PhotoGear",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
    inStock: false,
    isNew: true,
  },
  {
    id: "6",
    title: "Minimalist Desk Lamp - LED",
    description: "Modern LED desk lamp with adjustable brightness and color temperature. USB charging port included.",
    price: 59.99,
    originalPrice: 79.99,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    category: "Home & Garden",
    rating: 4.4,
    reviews: 76,
    seller: {
      name: "HomeStyle",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
      verified: true,
    },
    inStock: true,
  },
  {
    id: "7",
    title: "Running Shoes - Ultra Comfort",
    description: "Lightweight running shoes with advanced cushioning technology for maximum comfort.",
    price: 129.00,
    originalPrice: 159.00,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    category: "Sports",
    rating: 4.7,
    reviews: 312,
    seller: {
      name: "SportZone",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    inStock: true,
    isFeatured: true,
  },
  {
    id: "8",
    title: "Ceramic Coffee Mug Set - 4 Pack",
    description: "Beautiful handmade ceramic mugs. Microwave and dishwasher safe.",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
    category: "Home & Garden",
    rating: 4.3,
    reviews: 54,
    seller: {
      name: "CeramicArt",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      verified: false,
    },
    inStock: true,
  },
];

const categories = ["All", "Electronics", "Clothing", "Accessories", "Home & Garden", "Sports", "Books"];

export default function MarketplacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>(dummyProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleAddProduct = (formData: ProductFormData) => {
    const newProduct: Product = {
      id: String(products.length + 1),
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      image: formData.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      category: formData.category,
      rating: 0,
      reviews: 0,
      seller: {
        name: "John Doe",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        verified: false,
      },
      inStock: formData.inStock,
      isNew: true,
    };
    setProducts([newProduct, ...products]);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return a.isNew ? -1 : 1;
        default:
          return a.isFeatured ? -1 : 1;
      }
    });

  // Stats
  const stats = {
    totalProducts: products.length,
    inStock: products.filter((p) => p.inStock).length,
    featured: products.filter((p) => p.isFeatured).length,
    avgPrice: (products.reduce((acc, p) => acc + p.price, 0) / products.length).toFixed(2),
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
            <Button variant="primary" onClick={() => setShowAddProduct(true)}>
              <Plus size={18} className={isRTL ? "ml-2" : "mr-2"} />
              {t("marketplace", "addProduct")}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <Package size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-(--text)">{stats.totalProducts}</p>
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
                  <p className="text-2xl font-bold text-(--text)">{stats.inStock}</p>
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
                  <p className="text-2xl font-bold text-(--text)">{stats.featured}</p>
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
                  <p className="text-2xl font-bold text-(--text)">${stats.avgPrice}</p>
                  <p className="text-sm text-(--text-muted)">{t("marketplace", "avgPrice")}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder={t("marketplace", "searchProducts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
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
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-(--border) bg-(--bg-card) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm text-(--text-muted) mr-2">
                  {filteredProducts.length} products
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
          {filteredProducts.length > 0 ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              )}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <ShoppingBag size={48} className="mx-auto text-(--text-muted) mb-4" />
              <h3 className="text-lg font-semibold text-(--text) mb-2">No products found</h3>
              <p className="text-(--text-muted) mb-4">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                Clear Filters
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
