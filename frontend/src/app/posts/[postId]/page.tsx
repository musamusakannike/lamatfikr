"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Navbar, Sidebar } from "@/components/layout";
import { Card, CardContent } from "@/components/ui";
import { PostCard } from "@/components/shared/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { postsApi, type Post } from "@/lib/api/posts";

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params?.postId;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();

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
                <p className="text-sm text-(--text-muted)">Loading...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : post ? (
            <PostCard post={post} />
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-(--text-muted)">Post not found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
