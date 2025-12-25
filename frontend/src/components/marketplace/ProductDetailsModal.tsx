"use client";
import { Modal } from "@/components/ui/Modal";
import { Product } from "./ProductCard";
import { ProductDetailsContent } from "./ProductDetailsContent";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onFavoriteChange?: (productId: string, isFavorited: boolean) => void;
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  onFavoriteChange,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      <ProductDetailsContent product={product} onClose={onClose} onFavoriteChange={onFavoriteChange} />
    </Modal>
  );
}
