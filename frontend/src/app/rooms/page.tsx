"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Badge, Modal, Card, Button } from "@/components/ui";
import { InviteLinkModal } from "@/components/rooms/InviteLinkModal";
import { PendingRequestsModal } from "@/components/rooms/PendingRequestsModal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { roomsApi, Room, RoomMessage, RoomMember } from "@/lib/api/rooms";
import { uploadApi } from "@/lib/api/upload";
import { getErrorMessage } from "@/lib/api";
import {
  Plus,
  Users,
  MessageSquare,
  Lock,
  Globe,
  Crown,
  Search,
  Filter,
  MoreVertical,
  Settings,
  LogOut,
  Trash2,
  DollarSign,
  X,
  Image as ImageIcon,
  Check,
  Send,
  Loader2,
  ArrowLeft,
  Smile,
  Share2,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

type MembershipType = "free" | "paid";

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
];

type FilterType = "all" | "owned" | "joined" | "paid" | "free";

function RoomChatCard({ room, onClick }: { room: Room; onClick: () => void }) {
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
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MessageSquare size={24} className="text-(--text-muted)" />
            </div>
          )}
          {room.membershipType === "paid" && (
            <div className="absolute top-0 right-0 w-5 h-5 bg-yellow-500 flex items-center justify-center">
              <Crown size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-(--text) truncate">{room.name}</h3>
                {room.isPrivate && <Lock size={14} className="text-(--text-muted) shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {room.role && (
                  <Badge variant={room.role === "owner" ? "primary" : room.role === "admin" ? "secondary" : "default"} className="text-xs">
                    {room.role}
                  </Badge>
                )}
                <span className="text-xs text-(--text-muted)">{room.category}</span>
              </div>
            </div>
            {room.unreadCount > 0 && (
              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs text-white font-medium">{room.unreadCount}</span>
              </div>
            )}
          </div>

          {room.lastMessage && (
            <p className="text-sm text-(--text-muted) mt-2 truncate">
              {room.lastMessage.content}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-(--text-muted)">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {room.memberCount.toLocaleString()}
            </span>
            {room.membershipType === "paid" && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <DollarSign size={12} />
                {room.price} {room.currency}
              </span>
            )}
            {room.lastMessage && (
              <span className="ml-auto">{formatTime(room.lastMessage.createdAt)}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
}

function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [membershipType, setMembershipType] = useState<MembershipType>("free");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isPrivate, setIsPrivate] = useState(false);
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
        const uploadResult = await uploadApi.uploadImage(imageFile, "rooms");
        imageUrl = uploadResult.url;
      }

      await roomsApi.createRoom({
        name,
        description,
        image: imageUrl,
        category,
        membershipType,
        price: membershipType === "paid" ? parseFloat(price) : undefined,
        currency: membershipType === "paid" ? currency : undefined,
        isPrivate,
      });

      handleReset();
      onClose();
      onRoomCreated();
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
    setMembershipType("free");
    setPrice("");
    setCurrency("USD");
    setIsPrivate(false);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Room Chat" size="lg">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Room Image */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Room Image
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-(--bg) border-2 border-dashed border-(--border) flex items-center justify-center">
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Room preview" className="w-full h-full object-cover" />
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
                id="room-image"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => document.getElementById("room-image")?.click()}
              >
                <span>Upload Image</span>
              </Button>
              <p className="text-xs text-(--text-muted) mt-1">Recommended: 300x200px</p>
            </div>
          </div>
        </div>

        {/* Room Name */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Room Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter room name"
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
            placeholder="Describe what your room is about"
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

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-(--border) bg-(--bg)">
          <div className="flex items-center gap-3">
            {isPrivate ? <Lock size={20} className="text-(--text-muted)" /> : <Globe size={20} className="text-(--text-muted)" />}
            <div>
              <p className="font-medium text-(--text)">Private Room</p>
              <p className="text-sm text-(--text-muted)">Only invited members can join</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              isPrivate ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                isPrivate ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Membership Type */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-3">
            Membership Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMembershipType("free")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                membershipType === "free"
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-(--border) hover:border-primary-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Globe size={24} className={membershipType === "free" ? "text-primary-600" : "text-(--text-muted)"} />
                {membershipType === "free" && (
                  <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-(--text)">Free</p>
              <p className="text-sm text-(--text-muted)">Anyone can join for free</p>
            </button>

            <button
              type="button"
              onClick={() => setMembershipType("paid")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                membershipType === "paid"
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : "border-(--border) hover:border-yellow-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Crown size={24} className={membershipType === "paid" ? "text-yellow-600" : "text-(--text-muted)"} />
                {membershipType === "paid" && (
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-(--text)">Paid</p>
              <p className="text-sm text-(--text-muted)">Charge for membership</p>
            </button>
          </div>
        </div>

        {/* Paid Membership Options */}
        {membershipType === "paid" && (
          <div className="p-4 rounded-xl border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 space-y-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <DollarSign size={20} />
              <span className="font-medium">Membership Pricing</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-(--text) mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required={membershipType === "paid"}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text) mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="SAR">SAR (SAR)</option>
                  <option value="AED">AED (AED)</option>
                  <option value="KWD">KWD (KWD)</option>
                </select>
              </div>
            </div>

            <p className="text-sm text-(--text-muted)">
              Members will be charged this amount to join your room. You&apos;ll receive payments minus platform fees.
            </p>
          </div>
        )}

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
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditRoomModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  onRoomUpdated: () => void;
}

function EditRoomModal({ isOpen, room, onClose, onRoomUpdated }: EditRoomModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && isOpen) {
      setName(room.name);
      setDescription(room.description);
      setCategory(room.category);
      setImagePreview(room.image || null);
      setImageFile(null);
      setError(null);
    }
  }, [room, isOpen]);

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
    if (!room) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploadResult = await uploadApi.uploadImage(imageFile, "rooms");
        imageUrl = uploadResult.url;
      }

      await roomsApi.updateRoom(room.id, {
        name,
        description,
        image: imageUrl,
        category,
      });

      onClose();
      onRoomUpdated();
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

  if (!room) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Room" size="lg">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Room Image */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Room Image
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-(--bg) border-2 border-dashed border-(--border) flex items-center justify-center">
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Room preview" className="w-full h-full object-cover" />
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
                id="edit-room-image"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => document.getElementById("edit-room-image")?.click()}
              >
                <span>Change Image</span>
              </Button>
              <p className="text-xs text-(--text-muted) mt-1">Recommended: 300x200px</p>
            </div>
          </div>
        </div>

        {/* Room Name */}
        <div>
          <label className="block text-sm font-medium text-(--text) mb-2">
            Room Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter room name"
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
            placeholder="Describe what your room is about"
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

interface RoomDetailsModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (room: Room) => void;
  onLeave: (roomId: string) => void;
  onDelete: (roomId: string) => void;
  onOpenChat: (room: Room) => void;
  onEdit: (room: Room) => void;
}

function RoomDetailsModal({ room, isOpen, onClose, onJoin, onLeave, onDelete, onOpenChat, onEdit }: RoomDetailsModalProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!room) return null;

  const handleJoin = async () => {
    setIsLoading(true);
    await onJoin(room);
    setIsLoading(false);
  };

  const handleLeave = async () => {
    setIsLoading(true);
    await onLeave(room.id);
    setIsLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      setIsLoading(true);
      await onDelete(room.id);
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={room.name} size="md">
      <div className="p-4">
        {/* Room Header */}
        <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-(--bg)">
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              width={500}
              height={200}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MessageSquare size={48} className="text-(--text-muted)" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              {room.membershipType === "paid" && (
                <Badge variant="warning" className="gap-1">
                  <Crown size={12} />
                  Premium
                </Badge>
              )}
              {room.isPrivate && (
                <Badge variant="secondary" className="gap-1">
                  <Lock size={12} />
                  Private
                </Badge>
              )}
            </div>
            <p className="text-white/80 text-sm">{room.category}</p>
          </div>

          {/* Menu button */}
          {room.isMember && (
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <MoreVertical size={18} className="text-white" />
              </button>
              {showMenu && (
                <div className="absolute top-10 right-0 w-48 bg-(--bg-card) border border-(--border) rounded-xl shadow-lg overflow-hidden z-10">
                  {(room.role === "owner" || room.role === "admin") && (
                    <button
                      onClick={() => {
                        onEdit(room);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <Settings size={16} />
                      Edit Room
                    </button>
                  )}
                  {room.role !== "owner" && (
                    <button
                      onClick={handleLeave}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut size={16} />
                      Leave Room
                    </button>
                  )}
                  {room.role === "owner" && (
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Room
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-(--text-muted) mb-4">{room.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-(--text)">{room.memberCount.toLocaleString()}</p>
            <p className="text-xs text-(--text-muted)">Members</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-(--text)">{room.unreadCount}</p>
            <p className="text-xs text-(--text-muted)">Unread</p>
          </div>
        </div>

        {/* Membership Info */}
        {room.membershipType === "paid" && !room.isMember && (
          <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={18} className="text-yellow-600" />
              <span className="font-medium text-yellow-700 dark:text-yellow-400">Premium Room</span>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Membership fee: <span className="font-bold">${room.price} {room.currency}</span>
            </p>
          </div>
        )}

        {/* Your Role */}
        {room.isMember && room.role && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-(--bg) mb-4">
            <span className="text-sm text-(--text-muted)">Your Role</span>
            <Badge variant={room.role === "owner" ? "primary" : room.role === "admin" ? "secondary" : "default"}>
              {room.role.charAt(0).toUpperCase() + room.role.slice(1)}
            </Badge>
          </div>
        )}

        {/* Pending Status */}
        {room.membershipStatus === "pending" && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm mb-4">
            Your membership request is pending approval.
          </div>
        )}

        {/* Action Button */}
        {room.isMember ? (
          <Button variant="primary" className="w-full gap-2" onClick={() => onOpenChat(room)}>
            <MessageSquare size={18} />
            Open Chat
          </Button>
        ) : (
          <Button
            variant={room.membershipType === "paid" ? "secondary" : "primary"}
            className="w-full gap-2"
            onClick={handleJoin}
            disabled={isLoading || room.membershipStatus === "pending"}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : room.membershipType === "paid" ? (
              <>
                <Crown size={18} />
                Pay ${room.price} to Join
              </>
            ) : (
              <>
                <Users size={18} />
                Join Room
              </>
            )}
          </Button>
        )}
      </div>
    </Modal>
  );
}

interface ChatViewProps {
  room: Room;
  onBack: () => void;
}

function ChatView({ room, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await roomsApi.getMessages(room.id, { limit: 50 });
      setMessages(response.messages);
      // Mark room as read when messages are loaded
      await roomsApi.markAsRead(room.id).catch(() => {
        // Silently ignore errors for mark as read
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [room.id]);

  const loadMembers = useCallback(async () => {
    try {
      const response = await roomsApi.getMembers(room.id, { limit: 50 });
      setMembers(response.members);
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }, [room.id]);

  useEffect(() => {
    loadMessages();
    loadMembers();
  }, [loadMessages, loadMembers]);

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
          const result = await uploadApi.uploadImage(img.file, "rooms");
          uploadedMediaUrls.push(result.url);
        }
        setIsUploading(false);
      }

      const response = await roomsApi.sendMessage(room.id, {
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
          {room.image ? (
            <Image src={room.image} alt={room.name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MessageSquare size={16} className="text-(--text-muted)" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-(--text) truncate">{room.name}</h2>
          <p className="text-xs text-(--text-muted)">{room.memberCount} members</p>
        </div>
        {room.isPrivate && (room.role === "owner" || room.role === "admin") && (
          <>
            <button
              onClick={() => setShowPendingRequests(true)}
              className="p-2 hover:bg-(--bg) rounded-lg transition-colors text-(--text-muted) hover:text-yellow-600"
              title="Pending requests"
            >
              <UserPlus size={20} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 hover:bg-(--bg) rounded-lg transition-colors text-(--text-muted) hover:text-primary-600"
              title="Share invite link"
            >
              <Share2 size={20} />
            </button>
          </>
        )}
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

      {/* Invite Link Modal */}
      <InviteLinkModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room.id}
        isPrivate={room.isPrivate}
      />

      {/* Pending Requests Modal */}
      <PendingRequestsModal
        isOpen={showPendingRequests}
        onClose={() => setShowPendingRequests(false)}
        roomId={room.id}
        roomName={room.name}
        isPaidRoom={room.membershipType === "paid"}
      />
    </div>
  );
}

export default function RoomsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Room | null>(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        search?: string;
        filter?: "all" | "owned" | "joined";
        membershipType?: string;
      } = {};

      if (searchQuery) params.search = searchQuery;
      if (filter === "owned") params.filter = "owned";
      if (filter === "joined") params.filter = "joined";
      if (filter === "paid") params.membershipType = "paid";
      if (filter === "free") params.membershipType = "free";

      const response = await roomsApi.getRooms(params);
      setRooms(response.rooms);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filter]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleRoomClick = async (room: Room) => {
    try {
      // Verify access to the room (will throw 403 if private and not a member)
      await roomsApi.getRoom(room.id);
      setSelectedRoom(room);
      setIsDetailsModalOpen(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      if (errorMessage.includes("access to this private room")) {
        alert("You don't have access to this private room");
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleJoinRoom = async (room: Room) => {
    try {
      if (room.membershipType === "paid") {
        const response = await roomsApi.initiatePaidJoin(room.id);
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        }
      } else {
        await roomsApi.joinFreeRoom(room.id);
        loadRooms();
        setIsDetailsModalOpen(false);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    try {
      await roomsApi.leaveRoom(roomId);
      loadRooms();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await roomsApi.deleteRoom(roomId);
      loadRooms();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleOpenChat = (room: Room) => {
    setIsDetailsModalOpen(false);
    setActiveChat(room);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsEditModalOpen(true);
  };

  const handleRoomUpdated = () => {
    loadRooms();
    setIsDetailsModalOpen(false);
  };

  const ownedCount = rooms.filter((r) => r.role === "owner").length;
  const paidCount = rooms.filter((r) => r.membershipType === "paid").length;
  const freeCount = rooms.filter((r) => r.membershipType === "free").length;

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
          <ChatView room={activeChat} onBack={() => setActiveChat(null)} />
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
              <h1 className="text-2xl font-bold text-(--text)">{t("rooms", "title")}</h1>
              <p className="text-(--text-muted) text-sm mt-1">
                {rooms.length} rooms • {rooms.reduce((acc, r) => acc + r.unreadCount, 0)} unread messages
              </p>
            </div>
            <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} />
              {t("rooms", "createRoom")}
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
                placeholder={t("rooms", "searchRooms")}
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
                  {t("common", "all")} ({rooms.length})
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
                  {t("rooms", "owned")} ({ownedCount})
                </button>
                <button
                  onClick={() => setFilter("paid")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1",
                    filter === "paid"
                      ? "bg-yellow-500 text-white"
                      : "text-(--text-muted) hover:text-(--text)"
                  )}
                >
                  <Crown size={14} />
                  {t("rooms", "paid")} ({paidCount})
                </button>
                <button
                  onClick={() => setFilter("free")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    filter === "free"
                      ? "bg-primary-600 text-white"
                      : "text-(--text-muted) hover:text-(--text)"
                  )}
                >
                  {t("rooms", "free")} ({freeCount})
                </button>
              </div>
            </div>
          </div>

          {/* Room List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary-600" />
            </div>
          ) : rooms.length > 0 ? (
            <div className="space-y-3">
              {rooms.map((room) => (
                <RoomChatCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--bg-card) flex items-center justify-center">
                <MessageSquare size={32} className="text-(--text-muted)" />
              </div>
              <h3 className="text-lg font-medium text-(--text) mb-2">No rooms found</h3>
              <p className="text-(--text-muted) mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first room to get started"}
              </p>
              <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} />
                Create Room
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={loadRooms}
      />
      <RoomDetailsModal
        room={selectedRoom}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onJoin={handleJoinRoom}
        onLeave={handleLeaveRoom}
        onDelete={handleDeleteRoom}
        onOpenChat={handleOpenChat}
        onEdit={handleEditRoom}
      />
      <EditRoomModal
        isOpen={isEditModalOpen}
        room={editingRoom}
        onClose={() => setIsEditModalOpen(false)}
        onRoomUpdated={handleRoomUpdated}
      />
    </div>
  );
}
