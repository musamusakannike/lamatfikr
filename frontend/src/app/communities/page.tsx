"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Badge, Modal, Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/contexts/socket-context";
import { communitiesApi, Community, CommunityMessage, CommunityMember } from "@/lib/api/communities";
import { uploadApi } from "@/lib/api/upload";
import { getErrorMessage } from "@/lib/api";
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
} from "lucide-react";
import Image from "next/image";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

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
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card hover className="overflow-hidden cursor-pointer">
      <div className="flex gap-4 p-4" onClick={onClick}>
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-(--bg)">
          {community.image ? (
            <Image
              src={community.image}
              alt={community.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users size={24} className="text-(--text-muted)" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-(--text) truncate">{community.name}</h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {community.role && (
                  <Badge variant={community.role === "owner" ? "primary" : community.role === "admin" ? "secondary" : "default"} className="text-xs">
                    {community.role}
                  </Badge>
                )}
                <span className="text-xs text-(--text-muted)">{community.category}</span>
              </div>
            </div>
            {community.unreadCount > 0 && (
              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs text-white font-medium">{community.unreadCount}</span>
              </div>
            )}
          </div>

          {community.lastMessage && (
            <p className="text-sm text-(--text-muted) mt-2 truncate">
              {community.lastMessage.content}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-(--text-muted)">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {community.memberCount.toLocaleString()}
            </span>
            {community.lastMessage && (
              <span className="ml-auto">{formatTime(community.lastMessage.createdAt)}</span>
            )}
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

      await communitiesApi.createCommunity({
        name,
        description,
        image: imageUrl,
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
            Community Image
          </label>
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
                <span>Upload Image</span>
              </Button>
              <p className="text-xs text-(--text-muted) mt-1">Recommended: 300x200px</p>
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (community && isOpen) {
      setName(community.name);
      setDescription(community.description);
      setCategory(community.category);
      setImagePreview(community.image || null);
      setImageFile(null);
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

      await communitiesApi.updateCommunity(community.id, {
        name,
        description,
        image: imageUrl,
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
            Community Image
          </label>
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
                <span>Change Image</span>
              </Button>
              <p className="text-xs text-(--text-muted) mt-1">Recommended: 300x200px</p>
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
        <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-(--bg)">
          {community.image ? (
            <Image
              src={community.image}
              alt={community.name}
              width={500}
              height={200}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users size={48} className="text-(--text-muted)" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/80 text-sm">{community.category}</p>
          </div>

          {/* Menu button */}
          {community.isMember && (
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <MoreVertical size={18} className="text-white" />
              </button>
              {showMenu && (
                <div className="absolute top-10 right-0 w-48 bg-(--bg-card) border border-(--border) rounded-xl shadow-lg overflow-hidden z-10">
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
  const { socket, joinCommunity, leaveCommunity, sendTyping } = useSocket();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await communitiesApi.getMessages(community.id, { limit: 50 });
      setMessages(response.messages);
      // Mark community as read when messages are loaded
      await communitiesApi.markAsRead(community.id).catch(() => {
        // Silently ignore errors for mark as read
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [community.id]);

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
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (prev.some(msg => msg.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message];
        });
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, community.id]);

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
    if ((!newMessage.trim() && selectedImages.length === 0) || isSending) return;

    const savedMessage = newMessage;
    const savedImages = [...selectedImages];
    setNewMessage("");
    setSelectedImages([]);
    setIsSending(true);

    try {
      // Upload images first
      const uploadedMediaUrls: string[] = [];
      if (savedImages.length > 0) {
        setIsUploading(true);
        for (const img of savedImages) {
          const result = await uploadApi.uploadImage(img.file, "communities");
          uploadedMediaUrls.push(result.url);
        }
        setIsUploading(false);
      }

      const response = await communitiesApi.sendMessage(community.id, {
        content: savedMessage.trim() || undefined,
        media: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
      });
      setMessages((prev) => [...prev, response.data]);

      // Cleanup previews
      savedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    } catch (err) {
      console.error("Failed to send message:", err);
      // Restore on error
      setNewMessage(savedMessage);
      setSelectedImages(savedImages);
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    const newImages = imageFiles.slice(0, 4 - selectedImages.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages].slice(0, 4));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
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
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
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
                    {msg.content && (
                      <p className="text-(--text) text-sm mt-0.5 wrap-break-word">{msg.content}</p>
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
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-(--border) bg-(--bg-card)">
            {/* Image Previews */}
            {selectedImages.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={img.preview}
                      alt={`Selected ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              {/* Image Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedImages.length >= 4}
                className={cn(
                  "p-2.5 rounded-lg transition-colors",
                  selectedImages.length > 0
                    ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30"
                    : "text-(--text-muted) hover:bg-(--bg)",
                  selectedImages.length >= 4 && "opacity-50 cursor-not-allowed"
                )}
              >
                <ImageIcon size={20} />
              </button>

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
                disabled={(!newMessage.trim() && selectedImages.length === 0) || isSending || isUploading}
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
            <div className="space-y-3">
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
