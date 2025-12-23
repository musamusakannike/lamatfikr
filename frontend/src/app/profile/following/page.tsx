"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { UserCard } from "@/components/profile/UserCard";
import { Button, Card, CardContent } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi, type UserSummary } from "@/lib/api/social";
import { translations } from "@/lib/translations";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { ArrowLeft, Search, Loader2, UserPlus } from "lucide-react";

export default function FollowingPage() {
    const router = useRouter();
    const { language, isRTL } = useLanguage();
    const { user: authUser } = useAuth();
    const t = translations.followersFollowing;
    const tCommon = translations.common;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [following, setFollowing] = useState<UserSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        fetchFollowing();
    }, []);

    const fetchFollowing = async (pageNum = 1) => {
        try {
            if (pageNum === 1) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            const response = await socialApi.getFollowing(undefined, pageNum, 20);

            if (pageNum === 1) {
                setFollowing(response.following);
            } else {
                setFollowing((prev) => [...prev, ...response.following]);
            }

            setHasMore(response.pagination.page < response.pagination.pages);
            setPage(pageNum);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchFollowing(page + 1);
        }
    };

    const handleFollowChange = () => {
        // Refresh the following list
        fetchFollowing(1);
    };

    const filteredFollowing = following.filter((user) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.firstName.toLowerCase().includes(query) ||
            user.lastName.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen">
            <Navbar
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                isSidebarOpen={sidebarOpen}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
                <div className="max-w-2xl mx-auto p-4 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="flex-shrink-0"
                        >
                            <ArrowLeft size={20} className={cn(isRTL && "rotate-180")} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{t.followingTitle[language]}</h1>
                            <p className="text-sm text-(--text-muted)">
                                {following.length} {t.followingCount[language]}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={20}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 text-(--text-muted)",
                                isRTL ? "right-3" : "left-3"
                            )}
                        />
                        <input
                            type="text"
                            placeholder={t.searchFollowing[language]}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full px-10 py-3 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500",
                                isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                            )}
                        />
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
                            <p className="text-(--text-muted)">{t.loadingFollowing[language]}</p>
                        </div>
                    ) : filteredFollowing.length === 0 ? (
                        /* Empty State */
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                                    <UserPlus size={32} className="text-primary-500" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {searchQuery ? tCommon.search[language] : t.noFollowing[language]}
                                </h3>
                                <p className="text-(--text-muted) text-center">
                                    {searchQuery
                                        ? language === "ar"
                                            ? "لم يتم العثور على نتائج"
                                            : "No results found"
                                        : t.noFollowingDescription[language]}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Following List */
                        <div className="space-y-3">
                            {filteredFollowing.map((user) => (
                                <UserCard
                                    key={user._id}
                                    user={user}
                                    isFollowing={true}
                                    showFollowButton={user._id !== authUser?.id}
                                    onFollowChange={handleFollowChange}
                                />
                            ))}

                            {/* Load More Button */}
                            {hasMore && !searchQuery && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin mr-2" />
                                                {tCommon.loading[language]}
                                            </>
                                        ) : (
                                            language === "ar" ? "تحميل المزيد" : "Load More"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
