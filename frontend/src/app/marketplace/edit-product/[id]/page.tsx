"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi, Product } from "@/lib/api/marketplace";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Loader2,
  Package,
  Save,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProductFormData = {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  images: string[];
  inStock: boolean;
};

const categories = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Sports",
  "Beauty",
  "Toys",
  "Automotive",
  "Food & Beverages",
  "Other",
];

export default function EditProductPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();

  const productId = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)?.id;
    const normalized = Array.isArray(raw) ? raw[0] : raw;
    if (!normalized || normalized === "undefined") return null;
    return normalized;
  }, [params]);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    images: [],
    inStock: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !productId) {
      toast.error(t("editProduct", "invalidProductId"));
      router.push("/marketplace/my-listings");
    }
  }, [isAuthLoading, isAuthenticated, productId, router]);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const response = await marketplaceApi.getProduct(productId);
      setProduct(response.product);
      setFormData({
        title: response.product.title || "",
        description: response.product.description || "",
        price: response.product.price?.toString() || "",
        originalPrice: response.product.originalPrice?.toString() || "",
        category: response.product.category || "",
        images: response.product.images || [],
        inStock: (response.product.quantity || 0) > 0,
      });
    } catch (error) {
      console.error("Failed to load product:", error);
      toast.error(t("editProduct", "failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchProduct();
    }
  }, [fetchProduct, isAuthenticated, isAuthLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageAdd = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (formData.images.length >= 4) {
        alert(t("editProduct", "maxImages"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setFormData((prev) => ({ ...prev, images: [...prev.images, dataUrl] }));
        if (errors.images) {
          setErrors((prev) => ({ ...prev, images: "" }));
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleImageRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = t("editProduct", "titleRequired");
    if (!formData.description.trim()) newErrors.description = t("editProduct", "descriptionRequired");
    if (!formData.price || Number.isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = t("editProduct", "validPriceRequired");
    }
    if (!formData.category) newErrors.category = t("editProduct", "categoryRequired");
    if (formData.images.length === 0) newErrors.images = t("editProduct", "imageRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await marketplaceApi.updateProduct(productId, {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        category: formData.category,
        images: formData.images,
        quantity: formData.inStock ? 1 : 0,
      });

      toast.success(t("editProduct", "productUpdated"));
      router.push("/marketplace/my-listings");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("editProduct", "failedToUpdate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}> 
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">{t("editProduct", "title")}</h1>
              <p className="text-(--text-muted)">{t("editProduct", "updateListing")}</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft size={18} className={isRTL ? "ml-2" : "mr-2"} />
              {t("editProduct", "back")}
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            {isLoading ? (
              <div className="p-10 flex items-center justify-center gap-3 text-(--text-muted)">
                <Loader2 className="animate-spin" size={20} />
                {t("editProduct", "loadingProduct")}
              </div>
            ) : !product ? (
              <div className="p-10 text-center text-(--text-muted)">{t("editProduct", "productNotFound")}</div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-(--text) mb-2">
                    <ImageIcon size={16} className={cn("inline", isRTL ? "ml-2" : "mr-2")} />
                    {t("editProduct", "productImages")}
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-(--border)"
                      >
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 4 && (
                      <button
                        type="button"
                        onClick={handleImageAdd}
                        className={cn(
                          "aspect-square rounded-lg border-2 border-dashed border-(--border) flex flex-col items-center justify-center gap-2",
                          "hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors",
                          "text-(--text-muted) hover:text-primary-600"
                        )}
                      >
                        <Upload size={24} />
                        <span className="text-xs">{t("editProduct", "addImage")}</span>
                      </button>
                    )}
                  </div>
                  {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-(--text) mb-2">
                    <Package size={16} className={cn("inline", isRTL ? "ml-2" : "mr-2")} />
                    {t("editProduct", "productTitle")}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t("editProduct", "enterProductTitle")}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-(--bg-card) text-(--text) placeholder:text-(--text-muted)",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      errors.title ? "border-red-500" : "border-(--border)"
                    )}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-(--text) mb-2">
                    <FileText size={16} className={cn("inline", isRTL ? "ml-2" : "mr-2")} />
                    {t("editProduct", "description")}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("editProduct", "describeProduct")}
                    rows={4}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      errors.description ? "border-red-500" : "border-(--border)"
                    )}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-2">
                      <DollarSign size={16} className={cn("inline", isRTL ? "ml-2" : "mr-2")} />
                      {t("editProduct", "price")}
                    </label>
                    <div className="relative">
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 text-(--text-muted)",
                          isRTL ? "right-4" : "left-4"
                        )}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={cn(
                          "w-full py-3 rounded-lg border bg-(--bg-card) text-(--text) placeholder:text-(--text-muted)",
                          isRTL ? "pr-8 pl-4" : "pl-8 pr-4",
                          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                          errors.price ? "border-red-500" : "border-(--border)"
                        )}
                      />
                    </div>
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-2">
                      {t("editProduct", "originalPriceOptional")}
                    </label>
                    <div className="relative">
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 text-(--text-muted)",
                          isRTL ? "right-4" : "left-4"
                        )}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={cn(
                          "w-full py-3 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted)",
                          isRTL ? "pr-8 pl-4" : "pl-8 pr-4",
                          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-(--text) mb-2">
                    <Tag size={16} className={cn("inline", isRTL ? "ml-2" : "mr-2")} />
                    {t("editProduct", "category")}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-(--bg-card) text-(--text)",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      errors.category ? "border-red-500" : "border-(--border)"
                    )}
                  >
                    <option value="">{t("editProduct", "selectCategory")}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inStock: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="inStock" className="text-sm font-medium text-(--text)">
                    {t("editProduct", "productInStock")}
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-(--border)">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/marketplace/my-listings")}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {t("common", "cancel")}
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className={cn("animate-spin", isRTL ? "ml-2" : "mr-2")} size={18} />
                        {t("editProduct", "saving")}
                      </>
                    ) : (
                      <>
                        <Save size={18} className={isRTL ? "ml-2" : "mr-2"} />
                        {t("editProduct", "saveChanges")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
