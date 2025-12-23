"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { userSuggestionsApi, type SuggestedUser } from "@/lib/api/user-suggestions";
import { socialApi } from "@/lib/api/social";
import { Avatar } from "@/components/ui";
import { Navbar, Sidebar } from "@/components/layout";
import { UserPlus, UserCheck, Loader2, ArrowLeft, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

export default function SuggestionsPage() {
  const { t, isRTL } = useLanguage();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"suggested" | "nearby">("suggested");
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUsers([]);
    setPage(1);
    setHasMore(true);
    fetchUsers(1, viewMode);
  }, [viewMode]);

  const fetchUsers = async (pageNum: number, mode: "suggested" | "nearby") => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response =
        mode === "suggested"
          ? await userSuggestionsApi.getSuggestedUsers(pageNum, 20)
          : await userSuggestionsApi.getNearestUsers(pageNum, 20);

      if (pageNum === 1) {
        setUsers(response.users);
        const newFollowingStates = response.users.reduce<Record<string, boolean>>((acc, user) => {
          if (user.isFollowing) acc[user._id] = true;
          return acc;
        }, {});
        setFollowingStates(newFollowingStates);
      } else {
        setUsers((prev) => [...prev, ...response.users]);
        const newFollowingStates = response.users.reduce<Record<string, boolean>>((acc, user) => {
          if (user.isFollowing) acc[user._id] = true;
          return acc;
        }, {});
        setFollowingStates((prev) => ({ ...prev, ...newFollowingStates }));
      }

      // Handle different response structures if needed, but assuming they match for pagination
      // For nearest, response might have hasMore instead of pagination object if I followed implementation plan precisely
      // Checking actual response type from api file...
      // userSuggestionsApi.getNearestUsers returns NearbyUsersResponse { users, page, hasMore }
      // userSuggestionsApi.getSuggestedUsers returns SuggestedUsersResponse { users, pagination: { page, total, pages } }

      if (mode === "suggested") {
        const r = response as any; // Cast to access distinct shape
        setHasMore(r.pagination.page < r.pagination.pages);
      } else {
        const r = response as any;
        setHasMore(r.hasMore);
      }

      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    try {
      setFollowingLoading((prev) => ({ ...prev, [userId]: true }));

      if (isFollowing) {
        await socialApi.unfollowUser(userId);
        setFollowingStates((prev) => ({ ...prev, [userId]: false }));
      } else {
        await socialApi.followUser(userId);
        setFollowingStates((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowingLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchUsers(page + 1, viewMode);
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissedUsers((prev) => new Set(prev).add(userId));
  };

  return (
    <div className="min-h-screen bg-(--bg)">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-(--text-muted) hover:text-(--text) transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t("common", "back")}</span>
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t("suggestions", "discoverPeople")}</h1>
                <p className="text-(--text-muted)">{t("suggestions", "connectWithPeople")}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode("suggested")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                viewMode === "suggested"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {t("suggestions", "suggestedForYou")}
            </button>
            <button
              onClick={() => setViewMode("nearby")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                viewMode === "nearby"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {t("suggestions", "nearby")}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-(--bg-card) rounded-2xl p-12 text-center border border-(--border)">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("suggestions", "noSuggestionsYet")}</h3>
              <p className="text-(--text-muted) max-w-md mx-auto">
                {t("suggestions", "noSuggestionsDescription")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {users.filter(user => !dismissedUsers.has(user._id)).map((user) => {
                  const isFollowing = followingStates[user._id] || false;
                  const isLoading = followingLoading[user._id] || false;
                  const hasMutualFollowers = user.mutualFollowers && user.mutualFollowers.length > 0;

                  return (
                    <div
                      key={user._id}
                      className="bg-(--bg-card) rounded-2xl p-6 border border-(--border) hover:shadow-lg transition-shadow relative"
                    >
                      <button
                        onClick={() => handleDismiss(user._id)}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-5 h-5 text-(--text-muted)" />
                      </button>

                      <div className="flex flex-col items-center text-center">
                        <a href={`/user/${user.username}`} className="mb-4">
                          <Avatar
                            src={user.avatar || DEFAULT_AVATAR}
                            alt={user.firstName}
                            size="xl"
                            className="w-24 h-24"
                          />
                        </a>

                        <a
                          href={`/user/${user.username}`}
                          className="block hover:underline mb-2"
                        >
                          <h3 className="font-bold text-lg flex items-center justify-center gap-1.5">
                            {user.firstName} {user.lastName}
                            {user.verified && (
                              <VerifiedBadge size={20} />
                            )}
                          </h3>
                          <p className="text-sm text-(--text-muted)">@{user.username}</p>
                        </a>

                        {hasMutualFollowers && (
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {user.mutualFollowers!.slice(0, 3).map((mutual) => (
                                <Avatar
                                  key={mutual._id}
                                  src={mutual.avatar || DEFAULT_AVATAR}
                                  alt={mutual.firstName}
                                  size="sm"
                                  className="w-6 h-6 border-2 border-(--bg-card)"
                                />
                              ))}
                            </div>
                            <p className="text-xs text-(--text-muted)">
                              {t("suggestions", "followedBy")} {user.mutualFollowers![0].username}
                              {user.mutualFollowersCount! > 1 && (
                                <span>
                                  {" "}+ {user.mutualFollowersCount! - 1} {t("suggestions", "others")}
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => handleFollowToggle(user._id, isFollowing)}
                          disabled={isLoading}
                          className={cn(
                            "w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                            isFollowing
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                              : "bg-primary-500 text-white hover:bg-primary-600"
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-5 h-5" />
                                  <span>{t("suggestions", "following")}</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-5 h-5" />
                                  <span>{t("suggestions", "follow")}</span>
                                </>
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t("common", "loading")}</span>
                      </>
                    ) : (
                      <span>{t("suggestions", "loadMore")}</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
