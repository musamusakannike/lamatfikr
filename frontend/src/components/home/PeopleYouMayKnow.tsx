"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { userSuggestionsApi, type SuggestedUser } from "@/lib/api/user-suggestions";
import { socialApi } from "@/lib/api/social";
import { Avatar } from "@/components/ui";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

export function PeopleYouMayKnow() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      const response = await userSuggestionsApi.getSuggestedUsers(1, 5);
      setUsers(response.users);
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-(--bg-card) rounded-2xl p-4 border border-(--border)">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-(--text-muted)" />
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-(--bg-card) rounded-2xl p-4 border border-(--border)">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{t("suggestions", "peopleYouMayKnow")}</h3>
        <a
          href="/suggestions"
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {t("suggestions", "seeAll")}
        </a>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const isFollowing = followingStates[user._id] || false;
          const isLoading = followingLoading[user._id] || false;

          return (
            <div
              key={user._id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors"
            >
              <a href={`/user/${user.username}`} className="shrink-0">
                <Avatar
                  src={user.avatar || DEFAULT_AVATAR}
                  alt={user.firstName}
                  size="md"
                />
              </a>

              <div className="flex-1 min-w-0">
                <a
                  href={`/user/${user.username}`}
                  className="block hover:underline"
                >
                  <p className="font-semibold text-sm truncate flex items-center gap-1">
                    {user.firstName} {user.lastName}
                    {user.verified && (
                      <svg
                        className="w-4 h-4 text-primary-500"
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
                  </p>
                  <p className="text-xs text-(--text-muted) truncate">
                    @{user.username}
                  </p>
                </a>
                {user.followersCount > 0 && (
                  <p className="text-xs text-(--text-muted) mt-0.5">
                    {user.followersCount} {t("suggestions", "followers")}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleFollowToggle(user._id, isFollowing)}
                disabled={isLoading}
                className={cn(
                  "shrink-0 p-2 rounded-lg transition-colors",
                  isFollowing
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                )}
                title={
                  isFollowing
                    ? t("suggestions", "unfollow")
                    : t("suggestions", "follow")
                }
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
