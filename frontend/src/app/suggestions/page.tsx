"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { userSuggestionsApi, type SuggestedUser } from "@/lib/api/user-suggestions";
import { socialApi } from "@/lib/api/social";
import { Avatar } from "@/components/ui";
import { UserPlus, UserCheck, Loader2, ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await userSuggestionsApi.getSuggestedUsers(pageNum, 20);
      
      if (pageNum === 1) {
        setUsers(response.users);
      } else {
        setUsers((prev) => [...prev, ...response.users]);
      }

      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
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
      fetchSuggestedUsers(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg)">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-(--text-muted) hover:text-(--text) transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t("common", "back")}</span>
          </a>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((user) => {
                const isFollowing = followingStates[user._id] || false;
                const isLoading = followingLoading[user._id] || false;

                return (
                  <div
                    key={user._id}
                    className="bg-(--bg-card) rounded-2xl p-6 border border-(--border) hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <a href={`/user/${user.username}`} className="shrink-0">
                        <Avatar
                          src={user.avatar || DEFAULT_AVATAR}
                          alt={user.firstName}
                          size="lg"
                        />
                      </a>

                      <div className="flex-1 min-w-0">
                        <a
                          href={`/user/${user.username}`}
                          className="block hover:underline mb-1"
                        >
                          <h3 className="font-bold text-lg flex items-center gap-1.5">
                            {user.firstName} {user.lastName}
                            {user.verified && (
                              <svg
                                className="w-5 h-5 text-primary-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </h3>
                          <p className="text-sm text-(--text-muted)">@{user.username}</p>
                        </a>

                        {user.followersCount > 0 && (
                          <p className="text-sm text-(--text-muted) mb-3">
                            {user.followersCount} {t("suggestions", "followers")}
                          </p>
                        )}

                        {user.bio && (
                          <p className="text-sm text-(--text-muted) line-clamp-2 mb-4">
                            {user.bio}
                          </p>
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
    </div>
  );
}
