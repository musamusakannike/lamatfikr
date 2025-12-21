"use client";

import { useState, useEffect } from "react";
import { reelsApi, type Reel } from "@/lib/api/reels";
import { Loader2, ArrowLeft, Play, Plus } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import { Navbar, Sidebar } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateReelModal } from "@/components/reels/CreateReelModal";

export default function ReelsPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchReels();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore) return;

    try {
      const nextPage = page + 1;
      const response = await reelsApi.getReelsFeed(nextPage, 20);
      setReels((prev) => [...prev, ...response.reels]);
      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to load more reels:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
          <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft size={18} />
                    {t("reels", "backToHome")}
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">{t("reels", "title")}</h1>
              </div>
              <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
                <Plus size={18} />
                {t("reels", "createReel")}
              </Button>
            </div>
            <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
              <p className="text-(--text-muted) mb-4">{error}</p>
              <Button variant="outline" onClick={fetchReels}>
                {t("reels", "tryAgain")}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
          <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft size={18} />
                    {t("reels", "backToHome")}
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">{t("reels", "title")}</h1>
              </div>
              <Button className="gap-2">
                <Plus size={18} />
                {t("reels", "createReel")}
              </Button>
            </div>
            <div className="bg-(--bg-card) rounded-xl border border-(--border) p-6 text-center">
              <p className="text-(--text-muted) mb-4">{t("reels", "noReelsAvailable")}</p>
              <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
                <Plus size={18} />
                {t("reels", "createReel")}
              </Button>
            </div>
            <CreateReelModal
              isOpen={createModalOpen}
              onClose={() => setCreateModalOpen(false)}
              onSuccess={() => {
                setCreateModalOpen(false);
                fetchReels();
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={18} />
                  {t("reels", "backToHome")}
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">{t("reels", "title")}</h1>
            </div>
            <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
              <Plus size={18} />
              {t("reels", "createReel")}
            </Button>
          </div>

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {reels.map((reel) => (
              <div
                key={reel._id}
                className="break-inside-avoid mb-4 cursor-pointer group"
                onClick={() => setSelectedReel(reel)}
              >
                <div className="relative bg-(--bg-card) rounded-xl border border-(--border) overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-9/16 overflow-hidden">
                    <video
                      src={reel.videoUrl}
                      poster={reel.thumbnailUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-black ml-1" fill="black" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={reel.userId.avatar || "/default-avatar.png"}
                        alt={reel.userId.firstName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {reel.userId.firstName} {reel.userId.lastName}
                        </p>
                      </div>
                    </div>
                    {reel.caption && (
                      <p className="text-sm text-(--text-muted) line-clamp-2 mb-2">
                        {reel.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-(--text-muted)">
                      <span>{reel.viewCount.toLocaleString()} {t("reels", "views")}</span>
                      <span>•</span>
                      <span>{reel.likeCount} {t("reels", "likes")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("reels", "loading")}
                  </>
                ) : (
                  t("reels", "watchMore")
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Full Screen Viewer Modal */}
      {selectedReel && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setSelectedReel(null)}
        >
          <button
            onClick={() => setSelectedReel(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <span className="text-white text-xl">×</span>
          </button>
          <div className="w-full h-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <video
              src={selectedReel.videoUrl}
              poster={selectedReel.thumbnailUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
              loop
              playsInline
            />
          </div>
        </div>
      )}

      {/* Create Reel Modal */}
      <CreateReelModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchReels();
        }}
      />
    </div>
  );
}
