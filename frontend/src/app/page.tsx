"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { StoriesSection, FeaturedRooms, PostFeed, CreatePost, PeopleYouMayKnow } from "@/components/home";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <StoriesSection />
          <CreatePost />
          <PeopleYouMayKnow />
          <FeaturedRooms />
          <PostFeed />
        </div>
      </main>
    </div>
  );
}
