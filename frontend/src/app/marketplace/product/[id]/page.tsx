import { Metadata } from "next";
import { notFound } from "next/navigation";
// import { ProductDetailsContent } from "@/components/marketplace/ProductDetailsContent";
// import { Navbar, Sidebar } from "@/components/layout";
import { Product } from "@/lib/api/marketplace";
import axios from "axios";
import { ProductPageClientWrapper } from "./ProductPageClientWrapper";

// Helper to fetch product on server
async function getProduct(id: string): Promise<Product | null> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
        const response = await axios.get<{ product: Product }>(`${apiUrl}/marketplace/products/${id}`);
        return response.data.product;
    } catch (error) {
        console.error("Failed to fetch product for metadata", error);
        return null;
    }
}

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

    const imageUrl = product.images?.[0] || "/placeholder-product.png";
    const title = `${product.title} | Marketplace`;
    const description = product.description.substring(0, 160);

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 600,
                    alt: product.title,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-(--bg-background)">
            {/* We reuse the layout structure if needed, or just content if Navbar is global layout */}
            {/* Looking at other pages, Navbar seems to be used manually in pages sometimes or in layout. */}
            {/* MarketplacePage uses Navbar manually. So we might need it here or rely on global layout if this was under a group. */}
            {/* This file is in `app/marketplace/product/[id]/page.tsx`. `app/marketplace/page.tsx` has Navbar. */}
            {/* Let's wrap it in a client layout wrapper or just import Navbar (which is client) */}
            <ProductPageClientWrapper product={product} />
        </div>
    );
}
