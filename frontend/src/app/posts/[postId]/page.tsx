"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Navbar, Sidebar } from "@/components/layout";
import { Card, CardContent } from "@/components/ui";
import { PostCard } from "@/components/shared/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { postsApi, type Post } from "@/lib/api/posts";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { postId: string } }): Promise<Metadata> {
  const postId = params.postId;

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const res = await fetch(`${API_URL}/posts/${postId}`);
    const data = await res.json();
    const post: Post = data.post;

    if (!post) {
      return {
        title: "Post Not Found",
      };
    }

    const title = `${post.userId.firstName} ${post.userId.lastName} on LamatFikr`;
    const description = post.contentText?.slice(0, 160) || "Check out this post on LamatFikr";
    const images = post.media?.filter(m => m.type === 'image' && m.url).map(m => m.url) || [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: images.length > 0 ? images : ["/images/default-og.png"], // Fallback image if needed
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: images.length > 0 ? images : ["/images/default-og.png"],
      },
    };
  } catch {
    return {
      title: "LamatFikr",
    };
  }
}

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params?.postId;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!postId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await postsApi.getPost(postId);
        setPost(res.post);
      } catch {
        setError("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [postId]);

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">{t("posts", "loading")}</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-red-600">{error || t("posts", "failedToLoad")}</p>
              </CardContent>
            </Card>
          ) : post ? (
            <PostCard post={post} />
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">{t("posts", "postNotFound")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
