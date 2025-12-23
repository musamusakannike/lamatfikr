"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Badge, Modal, Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { communitiesApi, type Community, type CommunityMessage, type CommunityMember } from "@/lib/api/communities";
import { uploadApi } from "@/lib/api/upload";
import { useSocket } from "@/contexts/socket-context";
import { getErrorMessage } from "@/lib/api";
import { LocationPickerModal, type PickedLocation } from "@/components/shared/LocationPickerModal";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Plus,
  Users,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Settings,
  LogOut,
  Trash2,
  X,
  Image as ImageIcon,
  Check,
  Send,
  Loader2,
  ArrowLeft,
  Smile,
  MapPin,
  Mic,
  Camera,
  StopCircle,
  Edit2,
  MoreHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";

const categories = [
  "Technology",
  "Finance",
  "Art & Design",
  "Business",
  "Health & Fitness",
  "Photography",
  "Music",
  "Gaming",
  "Education",
  "Lifestyle",
  "Sports",
  "Travel",
  "Food",
  "Entertainment",
  "Science",
];

type FilterType = "all" | "owned" | "joined";

function CommunityChatCard({ community, onClick }: { community: Community; onClick: () => void }) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <Card hover className="overflow-hidden cursor-pointer h-full flex flex-col group border-0 shadow-md transition-shadow hover:shadow-lg md:w-[48%] h-full mx-auto">
      <div className="flex flex-col h-full" onClick={onClick}>
        {/* Cover Image */}
        <div className="relative h-28 bg-(--bg-muted)">
          {community.coverImage ? (
            <Image
              src={community.coverImage}
              alt={community.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary-500/10 to-primary-600/10 flex items-center justify-center">
              <Users size={32} className="text-primary-500/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
        </div>

        <div className="px-4 pb-4 flex-1 flex flex-col relative">
          {/* Avatar - overlaps cover */}
          <div className="-mt-10 mb-3 flex justify-between items-end">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-(--bg) border-4 border-(--bg-card) shadow-sm mx-auto">
              {community.image ? (
                <Image
                  src={community.image}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-(--bg-muted)">
                  <Users size={28} className="text-(--text-muted)" />
                </div>
              )}
            </div>

            {community.unreadCount > 0 && (
              <div className="mb-2 px-2 py-1 bg-primary-600 rounded-full shadow-sm">
                <span className="text-xs text-white font-bold">{community.unreadCount}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h3 className="font-bold text-lg text-(--text) truncate leading-tight group-hover:text-primary-600 transition-colors">
                {community.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                  {community.category}
                </span>
                {community.role && (
                  <Badge variant={community.role === "owner" ? "primary" : community.role === "admin" ? "secondary" : "default"} className="text-[10px] px-1.5 h-5">
                    {community.role}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-(--text-muted) line-clamp-3 mb-4 leading-relaxed">
              {community.description}
            </p>
          </div>

          <div className="pt-3 mt-auto border-t border-(--border) flex items-center justify-between text-xs text-(--text-muted)">
            {community.lastMessage ? (
              <div className="flex items-center gap-1.5 max-w-[70%]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                <span className="truncate">{community.lastMessage.content || "Media"}</span>
              </div>
            ) : (
              <span>No messages yet</span>
            )}
            <span className="flex items-center gap-1 shrink-0 ml-auto">
              {community.lastMessage ? formatTime(community.lastMessage.createdAt) : ""}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated: () => void;
}

function CreateCommunityModal({ isOpen, onClose, onCommunityCreated }: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const url = URL.createObjectURL(file);
      setCoverImagePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploadResult = await uploadApi.uploadImage(imageFile, "communities");
        imageUrl = uploadResult.url;
      }

      let coverImageUrl: string | undefined;
      if (coverImageFile) {
        const uploadResult = await uploadApi.uploadImage(coverImageFile, "communities");
        coverImageUrl = uploadResult.url;
      }

      await communitiesApi.createCommunity({
        name,
        description,
        image: imageUrl,
        coverImage: coverImageUrl,
        category,
      });

      handleReset();
      onClose();
      onCommunityCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setDescription("");
    setCategory("");
    setImageFile(null);
    setImagePreview(null);
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Community" size="lg">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Community Image */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Community Images
          </label>
          <div className="flex gap-4">
            {/* Avatar */}
            <div>
              <p className="text-xs text-(--text-muted) mb-1.5">Avatar</p>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-(--bg) border-2 border-dashed border-(--border) flex items-center justify-center">
                  {imagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Community preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-(--text-muted)" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="community-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => document.getElementById("community-image")?.click()}
                  >
                    <span>Upload Icon</span>
                  </Button>
                  <p className="text-xs text-(--text-muted) mt-1">Rec: 300x300px</p>
                </div>
              </div>
            </div>

            {/* Cover */}
            <div className="flex-1">
              <p className="text-xs text-(--text-muted) mb-1.5">Cover Image</p>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-(--bg) border-2 border-dashed border-(--border) flex items-center justify-center">
                  {coverImagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImagePreview(null)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-(--text-muted)" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    id="community-cover-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => document.getElementById("community-cover-image")?.click()}
                  >
                    <span>Upload Cover</span>
                  </Button>
                  <p className="text-xs text-(--text-muted) mt-1">Rec: 800x300px</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Name */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Community Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter community name"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your community is about"
            required
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-(--border)">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Create Community
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditCommunityModalProps {
  isOpen: boolean;
  community: Community | null;
  onClose: () => void;
  onCommunityUpdated: () => void;
}

function EditCommunityModal({ isOpen, community, onClose, onCommunityUpdated }: EditCommunityModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (community && isOpen) {
      setName(community.name);
      setDescription(community.description);
      setCategory(community.category);
      setImagePreview(community.image || null);
      setCoverImagePreview(community.coverImage || null);
      setImageFile(null);
      setCoverImageFile(null);
      setError(null);
    }
  }, [community, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const url = URL.createObjectURL(file);
      setCoverImagePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;

    setIsLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploadResult = await uploadApi.uploadImage(imageFile, "communities");
        imageUrl = uploadResult.url;
      }

      let coverImageUrl: string | undefined;
      if (coverImageFile) {
        const uploadResult = await uploadApi.uploadImage(coverImageFile, "communities");
        coverImageUrl = uploadResult.url;
      }

      await communitiesApi.updateCommunity(community.id, {
        name,
        description,
        image: imageUrl,
        coverImage: coverImageUrl,
        category,
      });

      onClose();
      onCommunityUpdated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setImagePreview(null);
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setError(null);
    onClose();
  };

  if (!community) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Community" size="lg">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Community Image */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Community Images
          </label>
          <div className="flex gap-4">
            {/* Avatar */}
            <div>
              <p className="text-xs text-(--text-muted) mb-1.5">Avatar</p>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-(--bg) border-2 border-dashed border-(--border) flex items-center justify-center">
                  {imagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Community preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-(--text-muted)" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="edit-community-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => document.getElementById("edit-community-image")?.click()}
                  >
                    <span>Change Icon</span>
                  </Button>
                  <p className="text-xs text-(--text-muted) mt-1">Rec: 300x300px</p>
                </div>
              </div>
            </div>

            {/* Cover */}
            <div className="flex-1">
              <p className="text-xs text-(--text-muted) mb-1.5">Cover Image</p>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-(--bg) border-2 border-dashed border-(--border) flex items-center justify-center">
                  {coverImagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImagePreview(null);
                          setCoverImageFile(null);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-(--text-muted)" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    id="edit-community-cover-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => document.getElementById("edit-community-cover-image")?.click()}
                  >
                    <span>Change Cover</span>
                  </Button>
                  <p className="text-xs text-(--text-muted) mt-1">Rec: 800x300px</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Name */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Community Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter community name"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your community is about"
            required
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-(--border)">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface CommunityDetailsModalProps {
  community: Community | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (community: Community) => void;
  onLeave: (communityId: string) => void;
  onDelete: (communityId: string) => void;
  onOpenChat: (community: Community) => void;
  onEdit: (community: Community) => void;
}

function CommunityDetailsModal({ community, isOpen, onClose, onJoin, onLeave, onDelete, onOpenChat, onEdit }: CommunityDetailsModalProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!community) return null;

  const handleJoin = async () => {
    setIsLoading(true);
    await onJoin(community);
    setIsLoading(false);
  };

  const handleLeave = async () => {
    setIsLoading(true);
    await onLeave(community.id);
    setIsLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      setIsLoading(true);
      await onDelete(community.id);
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={community.name} size="md">
      <div className="p-4">
        {/* Community Header */}
        <div className="relative h-32 rounded-xl overflow-hidden mb-4 bg-(--bg-muted)">
          {community.coverImage ? (
            <Image
              src={community.coverImage}
              alt={community.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary-500/10 to-primary-600/10 flex items-center justify-center">
              <Users size={48} className="text-primary-500/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />

          {/* Menu button */}
          {community.isMember && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <MoreVertical size={18} className="text-white" />
              </button>
              {showMenu && (
                <div className="absolute top-10 right-0 w-48 bg-(--bg-card) border border-(--border) rounded-xl shadow-lg overflow-hidden z-20">
                  {(community.role === "owner" || community.role === "admin") && (
                    <button
                      onClick={() => {
                        onEdit(community);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <Settings size={16} />
                      Edit Community
                    </button>
                  )}
                  {community.role !== "owner" && (
                    <button
                      onClick={handleLeave}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut size={16} />
                      Leave Community
                    </button>
                  )}
                  {community.role === "owner" && (
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Community
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-2 mb-4">
          {/* Avatar and Title Row */}
          <div className="flex items-end gap-4 -mt-12 mb-3 relative z-10">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-(--bg-card) border-4 border-(--bg-card) shadow-sm shrink-0">
              {community.image ? (
                <Image
                  src={community.image}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-(--bg-muted)">
                  <Users size={32} className="text-(--text-muted)" />
                </div>
              )}
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-bold text-(--text)">{community.name}</h2>
              <p className="text-sm text-(--text-muted)">{community.category}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-(--text-muted) mb-4">{community.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-(--text)">{community.memberCount.toLocaleString()}</p>
            <p className="text-xs text-(--text-muted)">Members</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-(--text)">{community.unreadCount}</p>
            <p className="text-xs text-(--text-muted)">Unread</p>
          </div>
        </div>

        {/* Your Role */}
        {community.isMember && community.role && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-(--bg) mb-4">
            <span className="text-sm text-(--text-muted)">Your Role</span>
            <Badge variant={community.role === "owner" ? "primary" : community.role === "admin" ? "secondary" : "default"}>
              {community.role.charAt(0).toUpperCase() + community.role.slice(1)}
            </Badge>
          </div>
        )}

        {/* Action Button */}
        {community.isMember ? (
          <Button variant="primary" className="w-full gap-2" onClick={() => onOpenChat(community)}>
            <MessageSquare size={18} />
            Open Chat
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full gap-2"
            onClick={handleJoin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Users size={18} />
                Join Community
              </>
            )}
          </Button>
        )}
      </div>
    </Modal>
  );
}

interface ChatViewProps {
  community: Community;
  onBack: () => void;
}

function ChatView({ community, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { socket, joinCommunity, leaveCommunity, sendTyping } = useSocket();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview?: string }>>([]);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [leafletMounted, setLeafletMounted] = useState(false);

  const getMessageId = useCallback((msg: unknown) => {
    if (!msg || typeof msg !== "object") return "";
    const record = msg as Record<string, unknown>;
    const id = record["id"] ?? record["_id"];
    return id ? String(id) : "";
  }, []);

  const normalizeMessage = useCallback(
    (msg: CommunityMessage) => {
      const id = getMessageId(msg);
      return Object.assign({}, msg, { id }) as CommunityMessage;
    },
    [getMessageId]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopAnyRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setIsRecordingAudio(false);
    setIsRecordingVideo(false);
  };

  useEffect(() => {
    setLeafletMounted(true);
    return () => {
      stopAnyRecording();
      selectedFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leafletMarkerIcon = useMemo(() => {
    const retina = (markerIcon2x as unknown as { src?: string })?.src ?? (markerIcon2x as unknown as string);
    const icon = (markerIcon as unknown as { src?: string })?.src ?? (markerIcon as unknown as string);
    const shadow = (markerShadow as unknown as { src?: string })?.src ?? (markerShadow as unknown as string);
    if (!icon) return undefined;
    return new L.Icon({
      iconRetinaUrl: retina || undefined,
      iconUrl: icon,
      shadowUrl: shadow || undefined,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await communitiesApi.getMessages(community.id, { limit: 50 });
      setMessages(response.messages.map((m) => normalizeMessage(m)));
      // Mark community as read when messages are loaded
      await communitiesApi.markAsRead(community.id).catch(() => {
        // Silently ignore errors for mark as read
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [community.id, normalizeMessage]);

  const loadMembers = useCallback(async () => {
    try {
      const response = await communitiesApi.getMembers(community.id, { limit: 50 });
      setMembers(response.members);
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }, [community.id]);

  useEffect(() => {
    loadMessages();
    loadMembers();
  }, [loadMessages, loadMembers]);

  // Join community room for real-time updates
  useEffect(() => {
    joinCommunity(community.id);
    return () => {
      leaveCommunity(community.id);
    };
  }, [community.id, joinCommunity, leaveCommunity]);

  // Listen for real-time messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { type: string; communityId?: string; message: CommunityMessage }) => {
      if (data.communityId === community.id) {
        const incomingId = getMessageId(data.message);
        setMessages((prev) => {
          if (!incomingId) return prev;
          if (prev.some((msg) => getMessageId(msg) === incomingId)) {
            return prev;
          }
          return [...prev, Object.assign({}, data.message, { id: incomingId }) as CommunityMessage];
        });
      }
    };

    socket.on("message:new", handleNewMessage);

    const handleMessageUpdated = (data: { communityId: string; messageId: string; content: string; editedAt: string }) => {
      if (data.communityId !== community.id) return;
      setMessages((prev) =>
        prev.map((m) => {
          const msgId = getMessageId(m);
          if (msgId !== data.messageId) return m;
          return { ...m, content: data.content, editedAt: data.editedAt };
        })
      );
    };

    const handleMessageDeleted = (data: { communityId: string; messageId: string }) => {
      if (data.communityId !== community.id) return;
      setMessages((prev) =>
        prev.map((m) => {
          const msgId = getMessageId(m);
          if (msgId !== data.messageId) return m;
          return { ...m, deletedAt: new Date().toISOString() };
        })
      );
    };

    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);

    const handleReaction = (data: { type: string; communityId?: string; messageId: string; reactions: unknown[] }) => {
      if (data.communityId !== community.id) return;
      if (!data.messageId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (getMessageId(m) !== String(data.messageId)) return m;
          return Object.assign({}, m, { reactions: data.reactions }) as CommunityMessage;
        })
      );
    };

    socket.on("message:reaction", handleReaction);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:reaction", handleReaction);
    };
  }, [socket, community.id, getMessageId]);

  const handleEditClick = (msg: CommunityMessage) => {
    setEditingMessageId(getMessageId(msg));
    setEditContent(msg.content || "");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      await communitiesApi.editMessage(community.id, messageId, editContent);
      setEditingMessageId(null);
      setEditContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm(t("common", "confirmMessageDelete"))) return;
    try {
      await communitiesApi.deleteMessage(community.id, messageId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewOnceMessage = async (messageId: string) => {
    try {
      await communitiesApi.markAsViewed(community.id, messageId);
      setMessages((prev) =>
        prev.map((msg) => {
          if (getMessageId(msg) !== messageId) return msg;
          return { ...msg, isExpired: true };
        })
      );
    } catch (err) {
      console.error("Failed to mark as viewed:", err);
    }
  };

  // Handle typing indicator
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newMessage.trim()) {
        sendTyping("community", community.id, true);
      } else {
        sendTyping("community", community.id, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [newMessage, community.id, sendTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || isSending) return;

    const savedMessage = newMessage;
    const savedFiles = [...selectedFiles];
    setNewMessage("");
    setSelectedFiles([]);
    setIsSending(true);

    try {
      const uploadedMediaUrls: string[] = [];
      const uploadedAttachments: Array<{ url: string; type: "image" | "video" | "audio"; name?: string; size?: number }> = [];

      if (savedFiles.length > 0) {
        setIsUploading(true);
        for (const item of savedFiles) {
          const result = await uploadApi.uploadMedia(item.file, "communities");
          if (result.type === "image") {
            uploadedMediaUrls.push(result.url);
          } else {
            uploadedAttachments.push({
              url: result.url,
              type: (result.type || (item.file.type.startsWith("video/") ? "video" : "audio")) as "video" | "audio",
              name: item.file.name,
              size: item.file.size,
            });
          }
        }
        setIsUploading(false);
      }

      const response = await communitiesApi.sendMessage(community.id, {
        content: savedMessage.trim() || undefined,
        media: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        isViewOnce,
      });
      setIsViewOnce(false);
      const sentId = getMessageId(response.data);
      setMessages((prev) => {
        if (!sentId) return prev;
        if (prev.some((msg) => getMessageId(msg) === sentId)) {
          return prev;
        }
        return [...prev, Object.assign({}, response.data, { id: sentId }) as CommunityMessage];
      });

      savedFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      // Restore on error
      setNewMessage(savedMessage);
      setSelectedFiles(savedFiles);
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const next = files.slice(0, Math.max(0, 6 - selectedFiles.length)).map((file) => {
      const needsPreview = file.type.startsWith("image/") || file.type.startsWith("video/");
      return { file, preview: needsPreview ? URL.createObjectURL(file) : undefined };
    });
    setSelectedFiles((prev) => [...prev, ...next].slice(0, 6));
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      const removed = next[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? newMessage.length;
      const end = input.selectionEnd ?? newMessage.length;
      const nextValue = newMessage.slice(0, start) + emojiData.emoji + newMessage.slice(end);
      setNewMessage(nextValue);

      requestAnimationFrame(() => {
        input.focus();
        const newPos = start + emojiData.emoji.length;
        input.setSelectionRange(newPos, newPos);
      });
    } else {
      setNewMessage((prev) => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await communitiesApi.toggleReaction(community.id, messageId, emoji);
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const startRecording = async (mode: "audio" | "video") => {
    if (isRecordingAudio || isRecordingVideo) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === "video" ? { video: true, audio: true } : { audio: true }
      );
      mediaStreamRef.current = stream;
      const mimeType = mode === "video" ? "video/webm" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) chunks.push(evt.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `${mode}-${Date.now()}.webm`, { type: mimeType });
        const preview = mode === "video" ? URL.createObjectURL(file) : undefined;
        setSelectedFiles((prev) => [...prev, { file, preview }].slice(0, 6));
        stopAnyRecording();
      };

      if (mode === "audio") setIsRecordingAudio(true);
      if (mode === "video") setIsRecordingVideo(true);
      recorder.start();
    } catch (err) {
      stopAnyRecording();
      console.error("Failed to start recording:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-4 p-4 border-b border-(--border) bg-(--bg-card)">
        <button onClick={onBack} className="p-2 hover:bg-(--bg) rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-(--text)" />
        </button>
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-(--bg)">
          {community.image ? (
            <Image src={community.image} alt={community.name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users size={16} className="text-(--text-muted)" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-(--text) truncate">{community.name}</h2>
          <p className="text-xs text-(--text-muted)">{community.memberCount} members</p>
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showMembers ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "hover:bg-(--bg) text-(--text-muted)"
          )}
        >
          <Users size={20} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={32} className="animate-spin text-primary-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-(--text-muted)">
                <MessageSquare size={48} className="mb-4" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const messageId = getMessageId(msg);
                const isOwnMessage = user?.id && msg.sender._id && user.id === msg.sender._id;
                const isEditing = editingMessageId === messageId;
                const isDeleted = !!msg.deletedAt;

                return (
                  <div key={messageId || msg.createdAt} className="flex gap-3 group relative hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-(--bg) shrink-0">
                      {msg.sender.avatar ? (
                        <Image src={msg.sender.avatar} alt={msg.sender.username} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-(--text-muted)">
                          {msg.sender.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-(--text) text-sm">
                          {msg.sender.displayName || msg.sender.username}
                        </span>
                        <span className="text-xs text-(--text-muted)">{formatTime(msg.createdAt)}</span>
                      </div>

                      <div className="mt-0.5">
                        {isDeleted ? (
                          <p className="text-(--text-muted) italic text-sm mt-0.5">{t("common", "messageDeleted")}</p>
                        ) : isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[200px] mt-1">
                            <Input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(messageId!);
                                }
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={handleCancelEdit}>
                                {t("common", "cancel")}
                              </Button>
                              <Button size="sm" variant="primary" className="h-6 text-xs px-2" onClick={() => handleSaveEdit(messageId!)}>
                                {t("common", "save")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* View Once Logic */}
                            {msg.isViewOnce && !msg.content && (!msg.media || msg.media.length === 0) && (!msg.attachments || msg.attachments.length === 0) && !msg.location ? (
                              <div className="flex items-center gap-3 p-2 min-w-[200px]">
                                <div className="bg-white/20 p-2 rounded-full">
                                  <EyeOff size={24} className={isOwnMessage ? "text-white" : "text-primary-600"} />
                                </div>
                                <div className="flex flex-col">
                                  <span className={cn("font-medium text-sm", isOwnMessage ? "text-white" : "text-gray-900 dark:text-gray-100")}>
                                    {t("common", "viewOnceMessage")}
                                  </span>
                                  {isOwnMessage ? (
                                    <span className={cn("text-xs", "text-white/70")}>
                                      {t("common", "sent")}
                                    </span>
                                  ) : msg.isExpired ? (
                                    <span className="text-xs text-gray-500 italic">
                                      {t("common", "opened")}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleViewOnceMessage(messageId!)}
                                      className={cn("text-xs underline text-left", "text-primary-600 dark:text-primary-400")}
                                    >
                                      {t("common", "tapToView")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                {msg.content && (
                                  <p className="text-(--text) text-sm mt-0.5 wrap-break-word">
                                    {msg.content}
                                    {msg.editedAt && (
                                      <span className="text-[10px] text-(--text-muted) ml-1 italic whitespace-nowrap">
                                        {t("common", "edited")}
                                      </span>
                                    )}
                                  </p>
                                )}

                                {msg.media && msg.media.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {msg.media.map((url, i) => (
                                      <Image
                                        key={i}
                                        src={url}
                                        alt="Media"
                                        width={200}
                                        height={150}
                                        className="rounded-lg max-w-[200px] object-cover"
                                      />
                                    ))}
                                  </div>
                                )}

                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="flex flex-col gap-2 mt-2">
                                    {msg.attachments.map((att, i) => (
                                      <div key={`${att.url}-${i}`}>
                                        {att.type === "video" ? (
                                          <video src={att.url} controls className="max-w-full rounded-lg" />
                                        ) : att.type === "audio" ? (
                                          <audio src={att.url} controls className="w-full" />
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {msg.location && (
                                  <div className="mt-2 rounded-lg border border-(--border) overflow-hidden">
                                    <div className="h-32 w-full bg-(--bg)">
                                      {leafletMounted ? (
                                        <MapContainer
                                          center={[msg.location.lat, msg.location.lng]}
                                          zoom={15}
                                          scrollWheelZoom={false}
                                          dragging={false}
                                          doubleClickZoom={false}
                                          zoomControl={false}
                                          attributionControl={false}
                                          className="h-full w-full"
                                        >
                                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                          <Marker position={[msg.location.lat, msg.location.lng]} icon={leafletMarkerIcon} />
                                        </MapContainer>
                                      ) : (
                                        <div className="h-full w-full" />
                                      )}
                                    </div>
                                    <div className="p-2">
                                      <p className="text-sm text-(--text)">{msg.location.label || "Location"}</p>
                                      <p className="text-xs text-(--text-muted)">
                                        {msg.location.lat.toFixed(6)}, {msg.location.lng.toFixed(6)}
                                      </p>
                                      <a
                                        href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs underline text-primary-600"
                                      >
                                        Open in Maps
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {(msg.reactions && msg.reactions.length > 0) && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Array.from(
                                  (msg.reactions || []).reduce((acc, r) => {
                                    const emoji = r.emoji;
                                    acc.set(emoji, (acc.get(emoji) || 0) + 1);
                                    return acc;
                                  }, new Map<string, number>())
                                ).map(([emoji, count]) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleToggleReaction(getMessageId(msg), emoji)}
                                    className="px-2 py-0.5 rounded-full text-xs bg-(--bg-card) border border-(--border)"
                                  >
                                    {emoji} {count}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReactingToMessageId(getMessageId(msg));
                                  setShowReactionPicker(true);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-(--text-muted) hover:text-primary-600"
                              >
                                <Smile size={14} />
                                React
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Menu */}
                      {isOwnMessage && !isDeleted && !isEditing && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-(--text-muted) hover:text-(--text) rounded-full"
                              >
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* 1 hour limit */}
                              {Date.now() - new Date(msg.createdAt).getTime() < 60 * 60 * 1000 && (
                                <DropdownMenuItem onClick={() => handleEditClick(msg)}>
                                  <Edit2 size={14} className="mr-2" />
                                  {t("common", "edit")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(messageId!)}
                                className="text-red-500 hover:text-red-600 focus:text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" />
                                {t("common", "delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-(--border) bg-(--bg-card)">
            {/* Image Previews */}
            {selectedFiles.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="relative group">
                    {item.preview && item.file.type.startsWith("image/") ? (
                      <Image
                        src={item.preview}
                        alt={`Selected ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : item.preview && item.file.type.startsWith("video/") ? (
                      <video src={item.preview} className="w-20 h-20 object-cover rounded-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-(--border) bg-(--bg) flex items-center justify-center">
                        <span className="text-xs text-(--text-muted)">{item.file.type.startsWith("audio/") ? "AUDIO" : "FILE"}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center relative">
              {/* Mobile Options Toggle */}
              <button
                type="button"
                className="md:hidden p-2.5 rounded-lg text-(--text-muted) hover:bg-(--bg) transition-colors shrink-0"
                onClick={() => setShowMobileOptions(!showMobileOptions)}
              >
                {showMobileOptions ? <X size={20} /> : <Plus size={20} />}
              </button>

              {/* Mobile Options Modal/Menu */}
              {showMobileOptions && (
                <>
                  <div
                    className="fixed inset-0 z-10 bg-black/5 md:hidden"
                    onClick={() => setShowMobileOptions(false)}
                  />
                  <div className="absolute bottom-16 left-0 bg-(--bg-card) border border-(--border) p-2 rounded-xl shadow-lg flex flex-wrap gap-2 md:hidden z-20 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in-20">
                    {/* Image Upload */}
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowMobileOptions(false);
                      }}
                      disabled={selectedFiles.length >= 6}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        selectedFiles.length > 0
                          ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                          : "text-(--text-muted) hover:bg-(--bg)",
                        selectedFiles.length >= 6 && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ImageIcon size={20} />
                    </button>

                    {/* Audio */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecordingAudio) stopAnyRecording();
                        else startRecording("audio");
                        setShowMobileOptions(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        isRecordingAudio ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-(--text-muted) hover:bg-(--bg)"
                      )}
                    >
                      {isRecordingAudio ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>

                    {/* Video */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecordingVideo) stopAnyRecording();
                        else startRecording("video");
                        setShowMobileOptions(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        isRecordingVideo ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-(--text-muted) hover:bg-(--bg)"
                      )}
                    >
                      {isRecordingVideo ? <StopCircle size={20} /> : <Camera size={20} />}
                    </button>

                    {/* Location */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowLocationPicker(true);
                        setShowMobileOptions(false);
                      }}
                      className={cn("p-2.5 rounded-lg transition-colors", "text-(--text-muted) hover:bg-(--bg)")}
                    >
                      <MapPin size={20} />
                    </button>

                    {/* View Once Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewOnce(!isViewOnce);
                        setShowMobileOptions(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        isViewOnce
                          ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                          : "text-(--text-muted) hover:bg-(--bg)"
                      )}
                    >
                      {isViewOnce ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    {/* Emoji */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowMobileOptions(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        showEmojiPicker
                          ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                          : "text-(--text-muted) hover:bg-(--bg)"
                      )}
                    >
                      <Smile size={20} />
                    </button>
                  </div>
                </>
              )}

              {/* Image Upload Button (Desktop) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                onChange={handleFilesSelect}
                className="hidden"
              />
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 6}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    selectedFiles.length > 0
                      ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                      : "text-(--text-muted) hover:bg-(--bg)",
                    selectedFiles.length >= 6 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ImageIcon size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => (isRecordingAudio ? stopAnyRecording() : startRecording("audio"))}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isRecordingAudio ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-(--text-muted) hover:bg-(--bg)"
                  )}
                >
                  {isRecordingAudio ? <StopCircle size={20} /> : <Mic size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => (isRecordingVideo ? stopAnyRecording() : startRecording("video"))}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isRecordingVideo ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-(--text-muted) hover:bg-(--bg)"
                  )}
                >
                  {isRecordingVideo ? <StopCircle size={20} /> : <Camera size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className={cn("p-2.5 rounded-lg transition-colors", "text-(--text-muted) hover:bg-(--bg)")}
                >
                  <MapPin size={20} />
                </button>
              </div>

              {/* Emoji Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    showEmojiPicker
                      ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                      : "text-(--text-muted) hover:bg-(--bg)"
                  )}
                >
                  <Smile size={20} />
                </button>

                {/* View Once Toggle */}
                <button
                  type="button"
                  onClick={() => setIsViewOnce(!isViewOnce)}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isViewOnce
                      ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                      : "text-(--text-muted) hover:bg-(--bg)"
                  )}
                  title={t("common", "viewOnceMessage")}
                >
                  {isViewOnce ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>

                {showEmojiPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-2 z-20">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        height={350}
                        width={320}
                        searchPlaceHolder="Search emoji..."
                        lazyLoadEmojis={true}
                      />
                    </div>
                  </>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending || isUploading}
              >
                {isSending || isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </form>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-64 border-l border-(--border) bg-(--bg-card) overflow-y-auto">
            <div className="p-4 border-b border-(--border)">
              <h3 className="font-semibold text-(--text)">Members ({members.length})</h3>
            </div>
            <div className="p-2">
              {members.map((member) => (
                <div key={member.user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-(--bg)">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-(--bg)">
                    {member.user.avatar ? (
                      <Image src={member.user.avatar} alt={member.user.username} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium text-(--text-muted)">
                        {member.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--text) truncate">
                      {member.user.displayName || member.user.username}
                    </p>
                    <p className="text-xs text-(--text-muted) capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        title="Send location"
        onConfirm={async (loc: PickedLocation) => {
          try {
            await communitiesApi.sendMessage(community.id, { location: loc });
          } catch (err) {
            console.error("Failed to send location:", err);
          }
        }}
      />

      {showReactionPicker && reactingToMessageId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowReactionPicker(false)} />
          <div className="relative bg-(--bg-card) border border-(--border) rounded-xl overflow-hidden">
            <EmojiPicker
              onEmojiClick={(e) => {
                handleToggleReaction(reactingToMessageId, e.emoji);
                setShowReactionPicker(false);
                setReactingToMessageId(null);
              }}
              height={350}
              width={320}
              lazyLoadEmojis={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunitiesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Community | null>(null);

  const loadCommunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        search?: string;
        filter?: "all" | "owned" | "joined";
      } = {};

      if (searchQuery) params.search = searchQuery;
      if (filter !== "all") params.filter = filter;

      const response = await communitiesApi.getCommunities(params);
      setCommunities(response.communities);
    } catch (err) {
      console.error("Failed to load communities:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filter]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const handleCommunityClick = async (community: Community) => {
    setSelectedCommunity(community);
    setIsDetailsModalOpen(true);
  };

  const handleJoinCommunity = async (community: Community) => {
    try {
      await communitiesApi.joinCommunity(community.id);
      loadCommunities();
      setIsDetailsModalOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      await communitiesApi.leaveCommunity(communityId);
      loadCommunities();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    try {
      await communitiesApi.deleteCommunity(communityId);
      loadCommunities();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleOpenChat = (community: Community) => {
    setIsDetailsModalOpen(false);
    setActiveChat(community);
  };

  const handleEditCommunity = (community: Community) => {
    setEditingCommunity(community);
    setIsEditModalOpen(true);
  };

  const handleCommunityUpdated = () => {
    loadCommunities();
    setIsDetailsModalOpen(false);
  };

  const ownedCount = communities.filter((c) => c.role === "owner").length;
  const joinedCount = communities.filter((c) => c.isMember).length;

  // Show chat view if active
  if (activeChat) {
    return (
      <div className="min-h-screen">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
          <ChatView community={activeChat} onBack={() => setActiveChat(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">{isRTL ? "المجتمعات" : "Communities"}</h1>
              <p className="text-(--text-muted) text-sm mt-1">
                {communities.length} communities • {communities.reduce((acc, c) => acc + c.unreadCount, 0)} unread messages
              </p>
            </div>
            <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} />
              {isRTL ? "إنشاء مجتمع" : "Create Community"}
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? "البحث في المجتمعات..." : "Search communities..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg-card) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-(--text-muted)" />
              <div className="flex bg-(--bg-card) border border-(--border) rounded-lg p-1">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    filter === "all"
                      ? "bg-primary-600 text-white"
                      : "text-(--text-muted) hover:text-(--text)"
                  )}
                >
                  {t("common", "all")} ({communities.length})
                </button>
                <button
                  onClick={() => setFilter("owned")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    filter === "owned"
                      ? "bg-primary-600 text-white"
                      : "text-(--text-muted) hover:text-(--text)"
                  )}
                >
                  {isRTL ? "مملوكة" : "Owned"} ({ownedCount})
                </button>
                <button
                  onClick={() => setFilter("joined")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    filter === "joined"
                      ? "bg-primary-600 text-white"
                      : "text-(--text-muted) hover:text-(--text)"
                  )}
                >
                  {isRTL ? "منضم" : "Joined"} ({joinedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Community List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
          ) : communities.length > 0 ? (
            <div className="gap-3 flex flex-wrap w-full">
              {communities.map((community) => (
                <CommunityChatCard
                  key={community.id}
                  community={community}
                  onClick={() => handleCommunityClick(community)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--bg-card) flex items-center justify-center">
                <Users size={32} className="text-(--text-muted)" />
              </div>
              <h3 className="text-lg font-medium text-(--text) mb-2">No communities found</h3>
              <p className="text-(--text-muted) mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first community to get started"}
              </p>
              <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} />
                Create Community
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCommunityCreated={loadCommunities}
      />
      <CommunityDetailsModal
        community={selectedCommunity}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onJoin={handleJoinCommunity}
        onLeave={handleLeaveCommunity}
        onDelete={handleDeleteCommunity}
        onOpenChat={handleOpenChat}
        onEdit={handleEditCommunity}
      />
      <EditCommunityModal
        isOpen={isEditModalOpen}
        community={editingCommunity}
        onClose={() => setIsEditModalOpen(false)}
        onCommunityUpdated={handleCommunityUpdated}
      />
    </div>
  );
}
