"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { StoriesSection, FeaturedRooms, PostFeed, CreatePost } from "@/components/home";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="pt-16 lg:pl-64">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <StoriesSection />
          <CreatePost />
          <FeaturedRooms />
          <PostFeed />
        </div>
      </main>
    </div>
  );
}
