"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  online?: boolean;
  hasStory?: boolean;
  storyViewed?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export function Avatar({
  src,
  alt = "Avatar",
  size = "md",
  className,
  online,
  hasStory,
  storyViewed,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900",
          sizeClasses[size],
          hasStory && !storyViewed && "ring-2 ring-primary-500 ring-offset-2 ring-offset-(--bg)",
          hasStory && storyViewed && "ring-2 ring-gray-300 dark:ring-gray-600 ring-offset-2 ring-offset-(--bg)"
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold">
            {alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-(--bg-card) rounded-full" />
      )}
    </div>
  );
}
