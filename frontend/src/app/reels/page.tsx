"use client";

import { useState, useEffect } from "react";
import { reelsApi, type Reel } from "@/lib/api/reels";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { InstagramReelsViewer } from "@/components/reels/InstagramReelsViewer";
import { ReelsMasonryGrid } from "@/components/reels/ReelsMasonryGrid";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type ViewMode = "grid" | "viewer";

export default function ReelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  // Get initial reel index from URL params if present
  const initialReelId = searchParams.get("reelId");

  useEffect(() => {
    fetchReels();
  }, []);

  // If reelId is in URL, switch to viewer mode once reels are loaded
  useEffect(() => {
    if (initialReelId && reels.length > 0) {
      const index = reels.findIndex((r) => r._id === initialReelId);
      if (index >= 0) {
        setSelectedReelIndex(index);
        setViewMode("viewer");
      }
    }
  }, [initialReelId, reels]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reelsApi.getReelsFeed(1, 20);
      setReels(response.reels);
      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(1);
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await reelsApi.getReelsFeed(nextPage, 20);
      setReels((prev) => [...prev, ...response.reels]);
      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to load more reels:", err);
      toast.error("Failed to load more reels");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClose = () => {
    if (viewMode === "viewer") {
      // Switch to grid view instead of going back
      setViewMode("grid");
    } else {
      // From grid view, go back to previous page
      router.back();
    }
  };

  const handleReelSelect = (index: number) => {
    setSelectedReelIndex(index);
    setViewMode("viewer");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6">
        <p className="text-lg mb-4">{error}</p>
        <button
          onClick={fetchReels}
          className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
        >
          {t("reels", "tryAgain")}
        </button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6">
        <p className="text-lg mb-4">{t("reels", "noReelsAvailable")}</p>
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
        >
          {t("common", "goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Header - Only show in grid view */}
      {viewMode === "grid" && (
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white">
                {t("reels", "allReels")}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Close/Back Button - Only show in viewer mode */}
      {viewMode === "viewer" && (
        <button
          onClick={handleClose}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all text-white"
          aria-label={t("reels", "backToGrid")}
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      {viewMode === "grid" ? (
        <ReelsMasonryGrid
          reels={reels}
          onReelClick={handleReelSelect}
          onLoadMore={loadMore}
          hasMore={hasMore}
          loading={loadingMore}
        />
      ) : (
        <InstagramReelsViewer
          initialReels={reels}
          initialIndex={selectedReelIndex}
          onLoadMore={loadMore}
          hasMore={hasMore}
        />
      )}

      {/* Loading More Indicator - Only in viewer mode */}
      {viewMode === "viewer" && loadingMore && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/70 backdrop-blur-md rounded-full flex items-center gap-2 text-white text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t("reels", "loading")}</span>
        </div>
      )}
    </div>
  );
}
