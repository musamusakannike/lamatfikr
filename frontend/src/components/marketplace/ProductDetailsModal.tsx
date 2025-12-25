"use client";
import { Modal } from "@/components/ui/Modal";
import { Product } from "./ProductCard";
import { ProductDetailsContent } from "./ProductDetailsContent";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  product,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      <ProductDetailsContent product={product} onClose={onClose} />
    </Modal>
  );
}
