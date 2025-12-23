"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  ProfileHeader,
  ProfileCompletion,
  ProfilePosts,
  EditProfileModal,
} from "@/components/profile";
import { CreatePost } from "@/components/home";

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

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
          {/* Profile Header with banner, avatar, edit options */}
          <ProfileHeader
            onEditProfile={() => setShowEditProfileModal(true)}
            onProfileUpdate={() => { }}
          />

          {/* Profile Completion Section */}
          <ProfileCompletion onEditProfile={() => setShowEditProfileModal(true)} />

          {/* Create Post */}
          <CreatePost />

          {/* Profile Posts with search and pagination */}
          <ProfilePosts />
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdate={() => { }}
      />
    </div>
  );
}
