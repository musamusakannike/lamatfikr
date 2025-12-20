"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Upload, X, Plus, DollarSign, Tag, Package, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/formatCurrency";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: ProductFormData) => void;
}

export interface ProductFormData {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  images: string[];
  quantity: number;
  currency: "SAR" | "USD" | "OMR";
}

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

export function AddProductModal({ isOpen, onClose, onSubmit }: AddProductModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    images: [],
    quantity: 1,
    currency: "SAR",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check if we can add more images
        if (formData.images.length >= 4) {
          alert(t("marketplace", "maxImagesAllowed"));
          return;
        }

        // Create file reader to convert image to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setFormData((prev) => ({ ...prev, images: [...prev.images, dataUrl] }));
        };
        reader.readAsDataURL(file);
      }
    };

    // Trigger file picker
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

    if (!formData.title.trim()) {
      newErrors.title = t("marketplace", "productTitleRequired");
    }
    if (!formData.description.trim()) {
      newErrors.description = t("marketplace", "descriptionRequired");
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = t("marketplace", "validPriceRequired");
    }
    if (!formData.category) {
      newErrors.category = t("marketplace", "categoryRequired");
    }
    if (formData.images.length === 0) {
      newErrors.images = t("marketplace", "atLeastOneImageRequired");
    }
    if (!Number.isFinite(formData.quantity) || formData.quantity < 0) {
      newErrors.quantity = t("marketplace", "validQuantityRequired");
    }
    if (!formData.currency) {
      newErrors.currency = t("marketplace", "currencyRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSubmit(formData);
    setIsSubmitting(false);

    // Reset form
    setFormData({
      title: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      images: [],
      quantity: 1,
      currency: "SAR",
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={t("marketplace", "addNewProduct")}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Images Section */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <ImageIcon size={16} className="inline mr-2" />
            {t("marketplace", "productImages")}
          </label>
          <div className="grid grid-cols-4 gap-3">
            {formData.images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-(--border)">
                <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
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
                <span className="text-xs">{t("marketplace", "addImage")}</span>
              </button>
            )}
          </div>
          {errors.images && (
            <p className="text-red-500 text-sm mt-1">{errors.images}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <Package size={16} className="inline mr-2" />
            {t("marketplace", "productTitle")}
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder={t("marketplace", "enterProductTitle")}
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-(--bg-card) text-(--text) placeholder:text-(--text-muted)",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              errors.title ? "border-red-500" : "border-(--border)"
            )}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <FileText size={16} className="inline mr-2" />
            {t("marketplace", "productDescription")}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder={t("marketplace", "describeYourProduct")}
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

        {/* Price Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-(--text) mb-2">
              <DollarSign size={16} className="inline mr-2" />
              {t("rooms", "price")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)">{getCurrencySymbol(formData.currency)}</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={cn(
                  "w-full pl-8 pr-4 py-3 rounded-lg border bg-(--bg-card) text-(--text) placeholder:text-(--text-muted)",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.price ? "border-red-500" : "border-(--border)"
                )}
              />
            </div>
            <p className="mt-2 text-xs text-(--text-muted)">
              {t("marketplace", "payoutWarning")}
            </p>
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-(--text) mb-2">
              {t("marketplace", "originalPriceOptional")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)">{getCurrencySymbol(formData.currency)}</span>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            {t("marketplace", "currency")}
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-(--bg-card) text-(--text)",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              errors.currency ? "border-red-500" : "border-(--border)"
            )}
          >
            <option value="SAR">{t("marketplace", "currencySAR")}</option>
            <option value="USD">{t("marketplace", "currencyUSD")}</option>
            <option value="OMR">{t("marketplace", "currencyOMR")}</option>
          </select>
          {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <Tag size={16} className="inline mr-2" />
            {t("rooms", "category")}
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
            <option value="">{t("marketplace", "selectCategoryPlaceholder")}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <Package size={16} className="inline mr-2" />
            {t("marketplace", "quantityInStock")}
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={String(formData.quantity)}
            onChange={(e) => {
              const next = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
              setFormData((prev) => ({ ...prev, quantity: Number.isFinite(next) ? next : 0 }));
              if (errors.quantity) {
                setErrors((prev) => ({ ...prev, quantity: "" }));
              }
            }}
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-(--bg-card) text-(--text) placeholder:text-(--text-muted)",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              errors.quantity ? "border-red-500" : "border-(--border)"
            )}
          />
          {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-(--border)">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {t("common", "cancel")}
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t("marketplace", "adding")}
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                {t("marketplace", "addProduct")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
