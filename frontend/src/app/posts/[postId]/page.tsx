import type { Metadata } from "next";
import { type Post } from "@/lib/api/posts";
import { PostClient } from "./PostClient";

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

export default function PostPage({ params }: { params: { postId: string } }) {
  return <PostClient postId={params.postId} />;
}
