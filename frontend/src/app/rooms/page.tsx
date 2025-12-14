"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Avatar, Button, Badge, Modal, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import Image from "next/image";

// Room types
type MembershipType = "free" | "paid";
type RoomRole = "owner" | "admin" | "member";

interface RoomChat {
  id: string;
  name: string;
  description: string;
  image: string;
  memberCount: number;
  activeNow: number;
  category: string;
  membershipType: MembershipType;
  price?: number;
  currency?: string;
  isPrivate: boolean;
  role: RoomRole;
  lastMessage?: {
    sender: string;
    text: string;
    time: string;
  };
  unreadCount: number;
  createdAt: string;
}

// Dummy data for room chats
const dummyRoomChats: RoomChat[] = [
  {
    id: "1",
    name: "Tech Innovators",
    description: "Discuss the latest in AI, Web3, and emerging technologies",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop",
    memberCount: 2453,
    activeNow: 89,
    category: "Technology",
    membershipType: "free",
    isPrivate: false,
    role: "member",
    lastMessage: {
      sender: "Sarah",
      text: "Has anyone tried the new GPT-5 API?",
      time: "2m ago",
    },
    unreadCount: 5,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Premium Traders Club",
    description: "Exclusive trading signals and market analysis for serious traders",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=200&fit=crop",
    memberCount: 456,
    activeNow: 34,
    category: "Finance",
    membershipType: "paid",
    price: 29.99,
    currency: "USD",
    isPrivate: true,
    role: "owner",
    lastMessage: {
      sender: "You",
      text: "Check out the new analysis I posted",
      time: "15m ago",
    },
    unreadCount: 0,
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Creative Minds",
    description: "A space for artists, designers, and creative professionals",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=200&fit=crop",
    memberCount: 1876,
    activeNow: 45,
    category: "Art & Design",
    membershipType: "free",
    isPrivate: false,
    role: "admin",
    lastMessage: {
      sender: "Mike",
      text: "Just shared my latest artwork!",
      time: "1h ago",
    },
    unreadCount: 12,
    createdAt: "2024-01-10",
  },
  {
    id: "4",
    name: "Startup Founders Elite",
    description: "Premium networking and mentorship for startup founders",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop",
    memberCount: 234,
    activeNow: 18,
    category: "Business",
    membershipType: "paid",
    price: 99.99,
    currency: "USD",
    isPrivate: true,
    role: "member",
    lastMessage: {
      sender: "Alex",
      text: "Weekly pitch session starts in 30 mins",
      time: "30m ago",
    },
    unreadCount: 3,
    createdAt: "2024-03-01",
  },
  {
    id: "5",
    name: "Fitness Warriors",
    description: "Daily workout tips, nutrition advice, and motivation",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop",
    memberCount: 3421,
    activeNow: 156,
    category: "Health & Fitness",
    membershipType: "free",
    isPrivate: false,
    role: "member",
    lastMessage: {
      sender: "Coach Dan",
      text: "New HIIT workout video is up!",
      time: "45m ago",
    },
    unreadCount: 8,
    createdAt: "2024-01-05",
  },
  {
    id: "6",
    name: "Pro Photography Masterclass",
    description: "Learn advanced photography techniques from industry experts",
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
    memberCount: 567,
    activeNow: 23,
    category: "Photography",
    membershipType: "paid",
    price: 49.99,
    currency: "USD",
    isPrivate: true,
    role: "member",
    lastMessage: {
      sender: "Emma",
      text: "Check out my night photography tips",
      time: "2h ago",
    },
    unreadCount: 0,
    createdAt: "2024-02-10",
  },
];

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

type FilterType = "all" | "owned" | "paid" | "free";

function RoomChatCard({ room, onClick }: { room: RoomChat; onClick: () => void }) {
  return (
    <Card hover className="overflow-hidden cursor-pointer" onClick={onClick}>
      <div className="flex gap-4 p-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
          <Image
            src={room.image}
            alt={room.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
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
                <Badge variant={room.role === "owner" ? "primary" : room.role === "admin" ? "secondary" : "default"} className="text-xs">
                  {room.role}
                </Badge>
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
              <span className="font-medium">{room.lastMessage.sender}:</span> {room.lastMessage.text}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-(--text-muted)">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {room.memberCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              {room.activeNow} online
            </span>
            {room.membershipType === "paid" && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <DollarSign size={12} />
                {room.price}/{room.currency}
              </span>
            )}
            <span className="ml-auto">{room.lastMessage?.time}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [membershipType, setMembershipType] = useState<MembershipType>("free");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isPrivate, setIsPrivate] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would create the room
    alert(`Room "${name}" created! (This is a dummy action)\n\nDetails:\n- Category: ${category}\n- Membership: ${membershipType}${membershipType === "paid" ? ` ($${price} ${currency})` : ""}\n- Private: ${isPrivate ? "Yes" : "No"}`);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setName("");
    setDescription("");
    setCategory("");
    setMembershipType("free");
    setPrice("");
    setCurrency("USD");
    setIsPrivate(false);
    setImagePreview(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Room Chat" size="lg">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
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
              <label htmlFor="room-image">
                <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild>
                  <span>Upload Image</span>
                </Button>
              </label>
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
                  <option value="NGN">NGN (₦)</option>
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
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 gap-2">
            <Plus size={18} />
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface RoomDetailsModalProps {
  room: RoomChat | null;
  isOpen: boolean;
  onClose: () => void;
}

function RoomDetailsModal({ room, isOpen, onClose }: RoomDetailsModalProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (!room) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={room.name} size="md">
      <div className="p-4">
        {/* Room Header */}
        <div className="relative h-40 rounded-xl overflow-hidden mb-4">
          <Image
            src={room.image}
            alt={room.name}
            width={500}
            height={200}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
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
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <MoreVertical size={18} className="text-white" />
            </button>
            {showMenu && (
              <div className="absolute top-10 right-0 w-48 bg-(--bg-card) border border-(--border) rounded-xl shadow-lg overflow-hidden z-10">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                  <Settings size={16} />
                  Room Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                  <LogOut size={16} />
                  Leave Room
                </button>
                {room.role === "owner" && (
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={16} />
                    Delete Room
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-(--text-muted) mb-4">{room.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-(--text)">{room.memberCount.toLocaleString()}</p>
            <p className="text-xs text-(--text-muted)">Members</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-green-600">{room.activeNow}</p>
            <p className="text-xs text-(--text-muted)">Online</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-(--bg)">
            <p className="text-2xl font-bold text-(--text)">{room.unreadCount}</p>
            <p className="text-xs text-(--text-muted)">Unread</p>
          </div>
        </div>

        {/* Membership Info */}
        {room.membershipType === "paid" && (
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-(--bg) mb-4">
          <span className="text-sm text-(--text-muted)">Your Role</span>
          <Badge variant={room.role === "owner" ? "primary" : room.role === "admin" ? "secondary" : "default"}>
            {room.role.charAt(0).toUpperCase() + room.role.slice(1)}
          </Badge>
        </div>

        {/* Action Button */}
        <Button variant="primary" className="w-full gap-2">
          <MessageSquare size={18} />
          Open Chat
        </Button>
      </div>
    </Modal>
  );
}

export default function RoomsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomChat | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const filteredRooms = dummyRoomChats.filter((room) => {
    // Apply filter
    if (filter === "owned" && room.role !== "owner") return false;
    if (filter === "paid" && room.membershipType !== "paid") return false;
    if (filter === "free" && room.membershipType !== "free") return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        room.name.toLowerCase().includes(query) ||
        room.description.toLowerCase().includes(query) ||
        room.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleRoomClick = (room: RoomChat) => {
    setSelectedRoom(room);
    setIsDetailsModalOpen(true);
  };

  const ownedCount = dummyRoomChats.filter((r) => r.role === "owner").length;
  const paidCount = dummyRoomChats.filter((r) => r.membershipType === "paid").length;
  const freeCount = dummyRoomChats.filter((r) => r.membershipType === "free").length;

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 lg:pl-64">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-(--text)">Room Chats</h1>
              <p className="text-(--text-muted) text-sm mt-1">
                {dummyRoomChats.length} rooms • {dummyRoomChats.reduce((acc, r) => acc + r.unreadCount, 0)} unread messages
              </p>
            </div>
            <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} />
              Create Room
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
                placeholder="Search rooms..."
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
                  All ({dummyRoomChats.length})
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
                  Owned ({ownedCount})
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
                  Paid ({paidCount})
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
                  Free ({freeCount})
                </button>
              </div>
            </div>
          </div>

          {/* Room List */}
          {filteredRooms.length > 0 ? (
            <div className="space-y-3">
              {filteredRooms.map((room) => (
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
      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <RoomDetailsModal
        room={selectedRoom}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
}
