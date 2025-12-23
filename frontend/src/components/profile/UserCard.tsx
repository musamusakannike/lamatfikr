"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@/components/ui";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { socialApi, type UserSummary } from "@/lib/api/social";
import { translations } from "@/lib/translations";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

interface UserCardProps {
    user: UserSummary;
    isFollowing?: boolean;
    showFollowButton?: boolean;
    onFollowChange?: () => void;
}

export function UserCard({
    user,
    isFollowing: initialIsFollowing = false,
    showFollowButton = true,
    onFollowChange,
}: UserCardProps) {
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations.followersFollowing;
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            setIsLoading(true);

            if (isFollowing) {
                await socialApi.unfollowUser(user._id);
                setIsFollowing(false);
                toast.success(
                    language === "ar"
                        ? `تم إلغاء متابعة ${user.firstName} ${user.lastName}`
                        : `Unfollowed ${user.firstName} ${user.lastName}`
                );
            } else {
                await socialApi.followUser(user._id);
                setIsFollowing(true);
                toast.success(
                    language === "ar"
                        ? `تتابع الآن ${user.firstName} ${user.lastName}`
                        : `Now following ${user.firstName} ${user.lastName}`
                );
            }

            onFollowChange?.();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = () => {
        router.push(`/user/${user.username}`);
    };

    return (
        <div
            className="cursor-pointer"
            onClick={handleCardClick}
        >
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-primary-100 dark:bg-primary-900">
                            <Image
                                src={user.avatar || DEFAULT_AVATAR}
                                alt={`${user.firstName} ${user.lastName}`}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base truncate">
                                    {user.firstName} {user.lastName}
                                </h3>
                                {user.verified && <VerifiedBadge size={16} />}
                            </div>
                            <p className="text-sm text-(--text-muted) truncate">
                                @{user.username}
                            </p>
                            {user.bio && (
                                <p className="text-sm text-(--text-muted) line-clamp-1 mt-1">
                                    {user.bio}
                                </p>
                            )}
                        </div>

                        {/* Follow Button */}
                        {showFollowButton && (
                            <Button
                                variant={isFollowing ? "secondary" : "primary"}
                                size="sm"
                                onClick={handleFollowToggle}
                                disabled={isLoading}
                                className="flex-shrink-0"
                            >
                                {isLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : isFollowing ? (
                                    t.following[language]
                                ) : (
                                    t.follow[language]
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
