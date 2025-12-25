"use client";

import NextImage from "next/image";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Product } from "./ProductCard";
import {
    Star,
    Heart,
    ShoppingCart,
    Share2,
    Truck,
    Shield,
    RefreshCw,
    Minus,
    Plus,
    MessageCircle,
    Laptop,
    CheckCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { marketplaceApi } from "@/lib/api/marketplace";
import { messagesApi } from "@/lib/api/messages";
import toast from "react-hot-toast";
import { ProductReviews } from "./ProductReviews";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface ProductDetailsContentProps {
    product: Product;
    onClose?: () => void;
}

export function ProductDetailsContent({
    product,
    onClose,
}: ProductDetailsContentProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(product?.isFavorited || false);
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
    const [isContactingSeller, setIsContactingSeller] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { addToCart, openCart } = useCart();

    // Memoize calculations to avoid impure function calls during render
    const discount = useMemo(() =>
        product?.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0, [product]
    );

    // Check if product is new (created within last 7 days)
    const isNew = useMemo(() => {
        if (!product?.createdAt) return false;
        const createdDate = new Date(product.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return createdDate > sevenDaysAgo;
    }, [product]);

    const handleAddToCart = async () => {
        if (!product || isAddingToCart) return;

        setIsAddingToCart(true);
        const success = await addToCart(product._id, quantity);
        setIsAddingToCart(false);

        if (success) {
            openCart();
        }
    };

    const handleToggleFavorite = async () => {
        if (!product || isTogglingFavorite) return;

        setIsTogglingFavorite(true);
        try {
            const response = await marketplaceApi.toggleFavorite(product._id);
            setIsLiked(response.isFavorited);
            toast.success(
                response.isFavorited
                    ? t("marketplace", "addedToFavorites")
                    : t("marketplace", "removedFromFavorites")
            );
        } catch {
            toast.error(t("marketplace", "failedToUpdateFavorites"));
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    const handleContactSeller = async () => {
        if (!product?.seller?._id || isContactingSeller) return;

        setIsContactingSeller(true);
        try {
            const { conversation } = await messagesApi.getOrCreateConversation(product.seller._id);
            router.push(`/messages?conversation=${conversation._id}`);
            if (onClose) onClose();
        } catch {
            toast.error(t("marketplace", "failedToContactSeller") || "Failed to contact seller");
        } finally {
            setIsContactingSeller(false);
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/marketplace/product/${product._id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: product.description.substring(0, 100) + '...',
                    url: shareUrl,
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    handleCopyToClipboard(shareUrl);
                }
            }
        } else {
            handleCopyToClipboard(shareUrl);
        }
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(t("marketplace", "linkCopied") || "Link copied to clipboard");
        }).catch(() => {
            toast.error(t("marketplace", "failedToCopy") || "Failed to copy link");
        });
    };

    return (
        <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="space-y-4">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
                        <NextImage
                            src={product.images?.[currentImageIndex] || product.image || "https://via.placeholder.com/400"}
                            alt={product.title || t("marketplace", "productImageAlt")}
                            fill
                            className="object-cover transition-opacity duration-300"
                        />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                            {isNew && <Badge variant="primary">{t("marketplace", "new")}</Badge>}
                            {discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
                            {product.isFeatured && <Badge variant="warning">{t("marketplace", "featured")}</Badge>}
                            {product.type === "digital" && (
                                <Badge variant="default" className="bg-purple-500 text-white flex items-center gap-1">
                                    <Laptop size={12} />
                                    {t("marketplace", "digitalProduct")}
                                </Badge>
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {product.images && product.images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex((prev) => (prev === 0 ? product.images!.length - 1 : prev - 1));
                                    }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex((prev) => (prev === product.images!.length - 1 ? 0 : prev + 1));
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}

                        {/* Image Gallery Indicators */}
                        {product.images && product.images.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                                {product.images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex(index);
                                        }}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-300",
                                            index === currentImageIndex
                                                ? "bg-white w-6"
                                                : "bg-white/50 w-1.5 hover:bg-white/80"
                                        )}
                                        aria-label={`Go to image ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-5">
                    {/* Category & Title */}
                    <div>
                        <span className="text-sm text-(--text-muted) uppercase tracking-wide">
                            {product.category}
                        </span>
                        <h2 className="text-2xl font-bold text-(--text) mt-1">
                            {product.title}
                        </h2>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={18}
                                    className={cn(
                                        i < Math.floor(product.rating)
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300 dark:text-gray-600"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-(--text-muted)">
                            {product.rating} ({product.reviewCount || product.reviews || 0} {t("marketplace", "reviewsLabel")})
                        </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-primary-600">
                            {formatCurrency(product.price, product.currency)}
                        </span>
                        {product.originalPrice && (
                            <span className="text-lg text-(--text-muted) line-through">
                                {formatCurrency(product.originalPrice, product.currency)}
                            </span>
                        )}
                        {discount > 0 && (
                            <Badge variant="success">
                                {t("marketplace", "saveAmount")
                                    .replace("{amount}", formatCurrency(product.originalPrice! - product.price, product.currency))}
                            </Badge>
                        )}
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center gap-2">
                        {(product.inStock !== undefined ? product.inStock : product.quantity > 0) ? (
                            <>
                                <CheckCircle size={18} className="text-green-500" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    {t("marketplace", "inStockWithCount").replace("{count}", String(product.quantity))}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-red-600 dark:text-red-400 font-medium">{t("marketplace", "outOfStock")}</span>
                            </>
                        )}
                    </div>

                    {/* Quantity Selector */}
                    {product.type !== "digital" && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-(--text)">{t("marketplace", "quantityLabel")}</span>
                            <div className="flex items-center border border-(--border) rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="px-4 py-2 font-medium min-w-[50px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            disabled={!(product.inStock !== undefined ? product.inStock : product.quantity > 0) || isAddingToCart}
                            onClick={handleAddToCart}
                        >
                            {isAddingToCart ? (
                                <Loader2 size={20} className="mr-2 animate-spin" />
                            ) : (
                                <ShoppingCart size={20} className="mr-2" />
                            )}
                            {isAddingToCart ? t("marketplace", "addingToCart") : t("marketplace", "addToCart")}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleToggleFavorite}
                            disabled={isTogglingFavorite}
                            className={cn(isLiked && "text-red-500 border-red-500")}
                        >
                            {isTogglingFavorite ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                            )}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleShare}>
                            <Share2 size={20} />
                        </Button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-(--border)">
                        {product.type === "digital" ? (
                            <>
                                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                    <Laptop size={24} className="text-primary-600 mb-1" />
                                    <span className="text-xs font-medium">{t("marketplace", "instantDownload")}</span>
                                </div>
                                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                    <Shield size={24} className="text-primary-600 mb-1" />
                                    <span className="text-xs font-medium">{t("marketplace", "securePayment")}</span>
                                </div>
                                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                    <CheckCircle size={24} className="text-primary-600 mb-1" />
                                    <span className="text-xs font-medium">{t("marketplace", "verifiedFile")}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                    <Truck size={24} className="text-primary-600 mb-1" />
                                    <span className="text-xs font-medium">{t("marketplace", "freeShippingShort")}</span>
                                </div>
                                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                    <Shield size={24} className="text-primary-600 mb-1" />
                                    <span className="text-xs font-medium">{t("marketplace", "securePayment")}</span>
                                </div>
                                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                    <RefreshCw size={24} className="text-primary-600 mb-1" />
                                    <span className="text-xs font-medium">{t("marketplace", "easyReturns")}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-(--border)">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <NextImage
                                src={product.seller?.avatar || "https://via.placeholder.com/100"}
                                alt={product.seller?.displayName || product.seller?.username || t("marketplace", "seller")}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-(--text)">
                                    {product.seller?.displayName || product.seller?.username || t("marketplace", "unknownSeller")}
                                </span>
                                {(product.seller?.isVerified || product.seller?.verified) && (
                                    <VerifiedBadge size={16} />
                                )}
                            </div>
                            <span className="text-sm text-(--text-muted)">{t("marketplace", "seller")}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleContactSeller}
                            disabled={isContactingSeller || !product.seller?._id}
                        >
                            {isContactingSeller ? (
                                <Loader2 size={16} className="mr-1 animate-spin" />
                            ) : (
                                <MessageCircle size={16} className="mr-1" />
                            )}
                            {t("marketplace", "contactSeller")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-t border-(--border) pt-6">
                <div className="flex gap-4 border-b border-(--border)">
                    <button
                        onClick={() => setActiveTab("description")}
                        className={cn(
                            "pb-3 px-1 font-medium transition-colors relative",
                            activeTab === "description"
                                ? "text-primary-600"
                                : "text-(--text-muted) hover:text-(--text)"
                        )}
                    >
                        {t("marketplace", "descriptionTab")}
                        {activeTab === "description" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={cn(
                            "pb-3 px-1 font-medium transition-colors relative",
                            activeTab === "reviews"
                                ? "text-primary-600"
                                : "text-(--text-muted) hover:text-(--text)"
                        )}
                    >
                        {t("marketplace", "reviewsTab")} ({product.reviewCount || product.reviews || 0})
                        {activeTab === "reviews" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                </div>

                <div className="py-4">
                    {activeTab === "description" ? (
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-(--text-muted whitespace-pre-wrap">{product.description}</p>

                            {/* Additional Product Details */}
                            <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium text-(--text-muted)">{t("marketplace", "condition")}</span>
                                    <p className="text-(--text) capitalize">{product.type === "digital" ? t("marketplace", "digitalFiles") : (product.condition || t("marketplace", "notSpecified"))}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-(--text-muted)">{t("marketplace", "category")}</span>
                                    <p className="text-(--text) capitalize">{product.category}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-(--text-muted)">{t("marketplace", "status")}</span>
                                    <p className="text-(--text) capitalize">{product.status || t("marketplace", "active")}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-(--text-muted)">{t("marketplace", "type")}</span>
                                    <p className="text-(--text) capitalize">{product.type === "digital" ? t("marketplace", "digitalProduct") : t("marketplace", "physicalProduct")}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ProductReviews productId={product._id} productTitle={product.title} />
                    )}
                </div>
            </div>
        </div>
    );
}
