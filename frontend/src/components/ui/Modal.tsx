"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (modalElement) {
      // Find first focusable element
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm",
          "transition-opacity duration-300"
        )}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-(--bg-card) rounded-xl shadow-2xl",
          "border border-(--border)",
          "transform transition-all duration-300",
          "max-h-[90vh] overflow-hidden",
          "flex flex-col",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-(--border)">
            {title && (
              <h2 className="text-lg font-semibold text-(--text)">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-(--text-muted)" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
