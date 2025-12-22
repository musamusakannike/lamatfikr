"use client";

import { useState, useEffect } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { PostCard } from "@/components/shared/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi, type Post } from "@/lib/api/posts";
import { cn } from "@/lib/utils";
import { Loader2, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function SavedPostsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { t, isRTL } = useLanguage();
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    // Renamed local loading state to avoid conflict with useAuth's isLoading
    const [isPostsLoading, setIsPostsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedPosts();
        }
    }, [isAuthenticated]);

    const fetchSavedPosts = async () => {
        try {
            setIsPostsLoading(true);
            const { posts: fetchedPosts, pagination } = await postsApi.getSavedPosts(1, 10);
            setPosts(fetchedPosts);
            setHasMore(pagination.page < pagination.pages);
            setPage(1);
        } catch (error) {
            console.error("Failed to fetch saved posts:", error);
        } finally {
            setIsPostsLoading(false);
        }
    };

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;

        try {
            setIsLoadingMore(true);
            const nextPage = page + 1;
            const { posts: newPosts, pagination } = await postsApi.getSavedPosts(nextPage, 10);

            setPosts((prev) => [...prev, ...newPosts]);
            setPage(nextPage);
            setHasMore(pagination.page < pagination.pages);
        } catch (error) {
            console.error("Failed to load more saved posts:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen">
            <Navbar
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                isSidebarOpen={sidebarOpen}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
                <div className="max-w-2xl mx-auto p-4 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                            <Bookmark size={24} />
                        </div>
                        <h1 className="text-2xl font-bold">{t("savedPosts", "title")}</h1>
                    </div>

                    {isPostsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                        </div>
                    ) : posts.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <PostCard key={post._id} post={post} />
                                ))}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 animate-spin" size={16} />
                                                {t("common", "loading")}
                                            </>
                                        ) : (
                                            t("home", "loadMorePosts")
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-card rounded-xl border border-border shadow-sm">
                            <div className="inline-flex p-4 rounded-full bg-primary-50 dark:bg-primary-900/10 mb-4">
                                <Bookmark className="text-primary-400" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{t("savedPosts", "noSavedPosts")}</h3>
                            <p className="text-muted-foreground">{t("savedPosts", "savedPostsDescription")}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
