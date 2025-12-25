"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { ProductDetailsContent } from "@/components/marketplace/ProductDetailsContent";
import { Product } from "@/lib/api/marketplace";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductPageClientWrapperProps {
    product: Product;
}

export function ProductPageClientWrapper({ product }: ProductPageClientWrapperProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isRTL } = useLanguage();

    return (
        <>
            <Navbar
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                isSidebarOpen={sidebarOpen}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
                <div className="max-w-7xl mx-auto p-4">
                    <div className="bg-(--bg-card) rounded-xl border border-(--border) shadow-sm">
                        <ProductDetailsContent product={product} />
                    </div>
                </div>
            </main>
        </>
    );
}
