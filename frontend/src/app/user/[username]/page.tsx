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
    CheckCircle,
    UserPlus,
    UserCheck,
    Loader2,
    ArrowLeft,
    MessageCircle,
    MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { profileApi, type PublicProfile } from "@/lib/api/profile";
import { socialApi } from "@/lib/api/social";
import { postsApi, type Post } from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

interface UserProfilePageProps {
    params: Promise<{ username: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
    const { username } = use(params);
    const router = useRouter();
    const { user: currentUser, isAuthenticated } = useAuth();
    const { isRTL } = useLanguage();
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
                        const { isFollowing: following } = await socialApi.checkFollowStatus(profileData.id);
                        setIsFollowing(following);
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
                        Back
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
                                    Go Home
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
                                    <div className="relative">
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

                                        {/* Verified badge */}
                                        {profile.verified && (
                                            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center border-2 border-(--bg-card)">
                                                <CheckCircle size={16} className="text-white" fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name and actions */}
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h1 className="text-2xl font-bold">
                                                    {profile.firstName} {profile.lastName}
                                                </h1>
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
                                                                Following
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus size={16} />
                                                                Follow
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <MessageCircle size={16} />
                                                        Message
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal size={20} />
                                            </Button>
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
                                        <span className="text-(--text-muted) ml-1">Followers</span>
                                    </div>
                                    <div>
                                        <span className="font-bold">{followingCount.toLocaleString()}</span>
                                        <span className="text-(--text-muted) ml-1">Following</span>
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
                                            <span>Works at {profile.workingAt}</span>
                                        </div>
                                    )}
                                    {profile.school && (
                                        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                                            <GraduationCap size={16} className="text-primary-500" />
                                            <span>Studied at {profile.school}</span>
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
                                            <span>Born on {formatDate(profile.birthday)}</span>
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
                                        Joined {formatJoinedDate(profile.createdAt)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* Posts Section */}
                    {profile && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Posts</h2>

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
                                                "Load more posts"
                                            )}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-(--text-muted)">No posts yet</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
