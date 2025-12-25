"use client";

import { useState, useEffect } from "react";
import { reelsApi, type Reel } from "@/lib/api/reels";
import { Loader2, ArrowLeft, X, Plus, Video } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { InstagramReelsViewer } from "@/components/reels/InstagramReelsViewer";
import { ReelsMasonryGrid } from "@/components/reels/ReelsMasonryGrid";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Navbar, Sidebar } from "@/components/layout";
import { CreateReelModal } from "@/components/reels/CreateReelModal";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ViewMode = "grid" | "viewer";

export default function ReelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRTL } = useLanguage();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      // Remove reelId from URL without refresh
      window.history.pushState({}, "", "/reels");
    } else {
      // From grid view, go back to previous page
      router.back();
    }
  };

  const handleReelSelect = (index: number) => {
    setSelectedReelIndex(index);
    setViewMode("viewer");
  };

  const handleReelCreated = () => {
    fetchReels(); // Refresh list
  };

  return (
    <div className="min-h-screen bg-(--bg-card)/95">
      {/* Only show Navbar and Sidebar in grid mode */}
      {viewMode === "grid" && (
        <>
          <Navbar
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            isSidebarOpen={sidebarOpen}
          />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      {/* Viewer Close Button - Only show in viewer mode, positioned fixed */}
      {viewMode === "viewer" && (
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all text-white"
          aria-label={t("reels", "backToGrid")}
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <main className={cn(
        "min-h-screen",
        viewMode === "grid" ? cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64") : ""
      )}>
        {loading ? (
          <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        ) : error ? (
          <div className="h-screen w-full flex flex-col items-center justify-center text-white p-6">
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={fetchReels}
              className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              {t("reels", "tryAgain")}
            </button>
          </div>
        ) : (
          <div className={cn(
            "relative flex flex-col",
            viewMode === "viewer" ? "h-screen" : "min-h-[calc(100vh-64px)]"
          )}>
            {/* Header - Only show in grid view */}
            {viewMode === "grid" && (
              <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between bg-(--bg-card)/95">
                  {/* Left Side: Back & Title */}
                  <div className="flex items-center gap-3">
                    <Link
                      href="/"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                      aria-label="Go home"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <Video size={24} className="text-primary-500" />
                      {t("reels", "allReels")}
                    </h1>
                  </div>

                  {/* Right Side: Create Button */}
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={20} />
                    <span className="hidden sm:inline">{t("reels", "postReel")}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className={cn("flex-1", viewMode === "viewer" ? "h-screen" : "")}>
              {reels.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white p-6 h-[50vh]">
                  <p className="text-lg mb-4">{t("reels", "noReelsAvailable")}</p>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    {t("reels", "createFirstReel")}
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <ReelsMasonryGrid
                  reels={reels}
                  onReelClick={handleReelSelect}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  loading={loadingMore}
                />
              ) : (
                // Viewer Mode: Full screen viewer
                <div className="h-screen w-full bg-black">
                  <InstagramReelsViewer
                    initialReels={reels}
                    initialIndex={selectedReelIndex}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <CreateReelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onReelCreated={handleReelCreated}
      />
    </div>
  );
}

