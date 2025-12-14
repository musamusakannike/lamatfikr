"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Upload, X, Plus, DollarSign, Tag, Package, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  inStock: boolean;
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
    // Simulate adding a dummy image
    const dummyImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop",
    ];
    const randomImage = dummyImages[Math.floor(Math.random() * dummyImages.length)];
    if (formData.images.length < 4) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, randomImage] }));
    }
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
      newErrors.title = "Product title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (formData.images.length === 0) {
      newErrors.images = "At least one image is required";
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
      inStock: true,
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Add New Product">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Images Section */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <ImageIcon size={16} className="inline mr-2" />
            Product Images
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
                <span className="text-xs">Add Image</span>
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
            Product Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter product title"
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
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your product..."
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
              Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)">$</span>
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
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-(--text) mb-2">
              Original Price (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)">$</span>
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

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            <Tag size={16} className="inline mr-2" />
            Category
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
            <option value="">Select a category</option>
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

        {/* Stock Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="inStock"
            checked={formData.inStock}
            onChange={(e) => setFormData((prev) => ({ ...prev, inStock: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="inStock" className="text-sm font-medium text-(--text)">
            Product is in stock
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-(--border)">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Adding...
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                Add Product
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
