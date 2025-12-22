"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, Button } from "@/components/ui";
import { PostCard } from "@/components/shared/PostCard";
import {
    MapPin,
    Briefcase,
    GraduationCap,
    Link as LinkIcon,
    Calendar,
    Heart,

    UserPlus,
    UserCheck,
    Loader2,
    ArrowLeft,
    MessageCircle,
    MoreHorizontal,
    Flag,
    Ban,
} from "lucide-react";
import Image from "next/image";
import { profileApi, type PublicProfile } from "@/lib/api/profile";
import { socialApi } from "@/lib/api/social";
import { postsApi, type Post } from "@/lib/api/posts";
import { messagesApi } from "@/lib/api/messages";
import { presenceApi } from "@/lib/api/presence";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import type { Socket } from "socket.io-client";
import { createAuthedSocket } from "@/lib/socket";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { BlockUserModal } from "@/components/shared/BlockUserModal";
import { ReportModal } from "@/components/shared/ReportModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

interface UserProfilePageProps {
    params: Promise<{ username: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
    const { username } = use(params);
    const router = useRouter();
    const { user: currentUser, isAuthenticated } = useAuth();
    const { isRTL, t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(false);

    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isStartingConversation, setIsStartingConversation] = useState(false);

    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const [isUserOnline, setIsUserOnline] = useState<boolean | null>(null);

    const isOwnProfile = currentUser?.username === username;

    // Redirect to own profile page if viewing own profile
    useEffect(() => {
        if (isOwnProfile) {
            router.push("/profile");
        }
    }, [isOwnProfile, router]);

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const { profile: profileData } = await profileApi.getPublicProfile(username);
                setProfile(profileData);

                try {
                    const presence = await presenceApi.getUserPresence(profileData.id);
                    setIsUserOnline(presence.isOnline);
                } catch {
                    setIsUserOnline(null);
                }

                // Fetch followers/following counts
                const [followersRes, followingRes] = await Promise.all([
                    socialApi.getFollowers(profileData.id),
                    socialApi.getFollowing(profileData.id),
                ]);
                setFollowersCount(followersRes.pagination.total);
                setFollowingCount(followingRes.pagination.total);

                // Check follow status if authenticated
                if (isAuthenticated && !isOwnProfile) {
                    try {
                        const { isFollowing: following, isBlocked: blocked } = await socialApi.checkFollowStatus(profileData.id);
                        setIsFollowing(following);
                        setIsBlocked(blocked);
                    } catch (err) {
                        console.error("Failed to check follow status:", err);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError(getErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        };

        if (username && !isOwnProfile) {
            fetchProfile();
        }
    }, [username, isAuthenticated, isOwnProfile]);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!profile?.id) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        let socket: Socket | null = null;

        try {
            socket = createAuthedSocket(token);
        } catch {
            return;
        }

        const handler = (payload: { userId: string; isOnline: boolean }) => {
            if (payload.userId === profile.id) {
                setIsUserOnline(payload.isOnline);
            }
        };

        socket.on("presence:update", handler);

        return () => {
            socket?.off("presence:update", handler);
            socket?.disconnect();
        };
    }, [isAuthenticated, profile?.id]);

    // Fetch user posts
    useEffect(() => {
        const fetchPosts = async () => {
            if (!profile?.id) return;

            try {
                setIsLoadingPosts(true);
                const { posts: fetchedPosts, pagination } = await postsApi.getUserPosts(profile.id, 1, 10);
                setPosts(fetchedPosts);
                setPostsPage(1);
                setHasMorePosts(pagination.page < pagination.pages);
            } catch (err) {
                console.error("Failed to fetch posts:", err);
                toast.error("Failed to load posts");
            } finally {
                setIsLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [profile?.id]);

    const loadMorePosts = async () => {
        if (!profile?.id || isLoadingPosts) return;

        try {
            setIsLoadingPosts(true);
            const nextPage = postsPage + 1;
            const { posts: fetchedPosts, pagination } = await postsApi.getUserPosts(profile.id, nextPage, 10);
            setPosts((prev) => [...prev, ...fetchedPosts]);
            setPostsPage(nextPage);
            setHasMorePosts(pagination.page < pagination.pages);
        } catch (err) {
            console.error("Failed to load more posts:", err);
            toast.error("Failed to load more posts");
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const handleFollow = async () => {
        if (isFollowLoading || !isAuthenticated || !profile) return;

        const previousFollowing = isFollowing;
        const previousFollowersCount = followersCount;

        // Optimistic update
        setIsFollowing(!isFollowing);
        setFollowersCount(previousFollowing ? followersCount - 1 : followersCount + 1);
        setIsFollowLoading(true);

        try {
            if (previousFollowing) {
                await socialApi.unfollowUser(profile.id);
                toast.success(`Unfollowed ${profile.firstName}`);
            } else {
                await socialApi.followUser(profile.id);
                toast.success(`Following ${profile.firstName}`);
            }
        } catch (err) {
            // Revert on error
            setIsFollowing(previousFollowing);
            setFollowersCount(previousFollowersCount);
            console.error(err);
            toast.error(previousFollowing ? "Failed to unfollow" : "Failed to follow");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    };

    const formatJoinedDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const handleStartConversation = async () => {
        if (!profile || !isAuthenticated || isStartingConversation) return;

        try {
            setIsStartingConversation(true);
            const { conversation } = await messagesApi.getOrCreateConversation(profile.id);
            router.push(`/messages?conversation=${conversation._id}`);
        } catch (err) {
            console.error("Failed to start conversation:", err);
            toast.error(getErrorMessage(err));
        } finally {
            setIsStartingConversation(false);
        }
    };

    if (isOwnProfile) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen">
            <Navbar
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                isSidebarOpen={sidebarOpen}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
                <div className="max-w-2xl mx-auto p-4 space-y-6">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft size={16} />
                        {t("userProfile", "back")}
                    </Button>

                    {/* Profile Card */}
                    {isLoading ? (
                        <Card className="overflow-hidden">
                            <div className="h-48 sm:h-56 md:h-64 bg-primary-100 dark:bg-primary-900/50 animate-pulse" />
                            <CardContent className="relative pt-0 pb-6">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
                                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-primary-200 dark:bg-primary-800 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-6 w-48 bg-primary-200 dark:bg-primary-800 rounded animate-pulse" />
                                        <div className="h-4 w-32 bg-primary-200 dark:bg-primary-800 rounded animate-pulse" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : error ? (
                        <Card className="overflow-hidden">
                            <CardContent className="p-8 text-center">
                                <p className="text-(--text-muted)">{error}</p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push("/")}
                                    className="mt-4"
                                >
                                    {t("userProfile", "goHome")}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : profile ? (
                        <Card className="overflow-hidden">
                            {/* Banner Image */}
                            <div className="relative h-48 sm:h-56 md:h-64 bg-linear-to-r from-primary-500 to-primary-700">
                                {profile.coverPhoto && (
                                    <Image
                                        src={profile.coverPhoto}
                                        alt="Cover photo"
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>

                            <CardContent className="relative pt-0 pb-6">
                                {/* Avatar and Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
                                    <div className="relative sm:mb-6">
                                        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-(--bg-card) overflow-hidden bg-primary-100 dark:bg-primary-900">
                                            {profile.avatar ? (
                                                <Image
                                                    src={profile.avatar}
                                                    alt={`${profile.firstName} ${profile.lastName}`}
                                                    width={144}
                                                    height={144}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Image
                                                    src={DEFAULT_AVATAR}
                                                    alt="Default avatar"
                                                    width={144}
                                                    height={144}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Name and actions */}
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h1 className="text-2xl font-bold">
                                                    {profile.firstName} {profile.lastName}
                                                </h1>
                                                {profile.verified && (
                                                    <VerifiedBadge size={20} />
                                                )}
                                                {isUserOnline !== null && (
                                                    <span
                                                        className={cn(
                                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                                            isUserOnline
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                                                        )}
                                                    >
                                                        {isUserOnline ? "Online" : "Offline"}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-(--text-muted)">@{profile.username}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isAuthenticated && (
                                                <>
                                                    <Button
                                                        variant={isFollowing ? "outline" : "primary"}
                                                        size="sm"
                                                        onClick={handleFollow}
                                                        disabled={isFollowLoading}
                                                        className={cn(
                                                            "gap-2",
                                                            isFollowing && "hover:border-red-500 hover:text-red-500"
                                                        )}
                                                    >
                                                        {isFollowLoading ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : isFollowing ? (
                                                            <>
                                                                <UserCheck size={16} />
                                                                {t("userProfile", "following")}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus size={16} />
                                                                {t("userProfile", "follow")}
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={handleStartConversation}
                                                        disabled={isStartingConversation}
                                                    >
                                                        {isStartingConversation ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <MessageCircle size={16} />
                                                        )}
                                                        {t("userProfile", "message")}
                                                    </Button>
                                                </>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal size={20} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-red-500">
                                                        <Flag className="mr-2 h-4 w-4" />
                                                        Report User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setShowBlockModal(true)} className={isBlocked ? "text-primary-500" : "text-red-500"}>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        {isBlocked ? "Unblock User" : "Block User"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                {profile.bio && (
                                    <p className="mt-4 text-(--text) whitespace-pre-wrap">{profile.bio}</p>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-6 mt-4">
                                    <div>
                                        <span className="font-bold">{followersCount.toLocaleString()}</span>
                                        <span className="text-(--text-muted) ml-1">{t("userProfile", "followers")}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold">{followingCount.toLocaleString()}</span>
                                        <span className="text-(--text-muted) ml-1">{t("userProfile", "followingCount")}</span>
                                    </div>
                                </div>

                                {/* Personal Details */}
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {profile.address && (
                                        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                            <MapPin size={16} className="text-primary-500" />
                                            <span>{profile.address}</span>
                                        </div>
                                    )}
                                    {profile.workingAt && (
                                        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                            <Briefcase size={16} className="text-primary-500" />
                                            <span>{t("userProfile", "worksAt")} {profile.workingAt}</span>
                                        </div>
                                    )}
                                    {profile.school && (
                                        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                            <GraduationCap size={16} className="text-primary-500" />
                                            <span>{t("userProfile", "studiedAt")} {profile.school}</span>
                                        </div>
                                    )}
                                    {profile.website && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <LinkIcon size={16} className="text-primary-500" />
                                            <a
                                                href={profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                {profile.website.replace(/^https?:\/\//, "")}
                                            </a>
                                        </div>
                                    )}
                                    {profile.birthday && (
                                        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                            <Calendar size={16} className="text-primary-500" />
                                            <span>{t("userProfile", "bornOn")} {formatDate(profile.birthday)}</span>
                                        </div>
                                    )}
                                    {profile.relationshipStatus && (
                                        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                            <Heart size={16} className="text-primary-500" />
                                            <span>{profile.relationshipStatus}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Joined date */}
                                {profile.createdAt && (
                                    <p className="mt-4 text-sm text-(--text-muted)">
                                        {t("userProfile", "joined")} {formatJoinedDate(profile.createdAt)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* Posts Section */}
                    {profile && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">{t("userProfile", "posts")}</h2>

                            {isLoadingPosts && posts.length === 0 ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={32} className="animate-spin text-primary-500" />
                                </div>
                            ) : posts.length > 0 ? (
                                <>
                                    <div className="space-y-4">
                                        {posts.map((post) => (
                                            <PostCard key={post._id} post={post} />
                                        ))}
                                    </div>

                                    {hasMorePosts && (
                                        <Button
                                            variant="outline"
                                            onClick={loadMorePosts}
                                            disabled={isLoadingPosts}
                                            className="w-full"
                                        >
                                            {isLoadingPosts ? (
                                                <>
                                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                t("userProfile", "loadMorePosts")
                                            )}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-(--text-muted)">{t("userProfile", "noPostsYet")}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </main>
            {profile && (
                <>
                    <BlockUserModal
                        isOpen={showBlockModal}
                        onClose={() => setShowBlockModal(false)}
                        userId={profile.id}
                        username={profile.username}
                        isBlocked={isBlocked}
                        onSuccess={(blocked) => {
                            setIsBlocked(blocked);
                            if (blocked) {
                                router.push("/");
                            }
                        }}
                    />
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        targetType="user"
                        targetId={profile.id}
                    />
                </>
            )}
        </div>
    );
}
