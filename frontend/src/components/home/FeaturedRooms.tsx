"use client";

import { Badge, Button, Card } from "@/components/ui";
import { Users, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeaturedRoom {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  activeNow: number;
  image: string;
  category: string;
}

const featuredRooms: FeaturedRoom[] = [
  {
    id: "1",
    name: "Tech Innovators",
    description: "Discuss the latest in AI, Web3, and emerging technologies",
    memberCount: 2453,
    activeNow: 89,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop",
    category: "Technology",
  },
  {
    id: "2",
    name: "Creative Minds",
    description: "A space for artists, designers, and creative professionals",
    memberCount: 1876,
    activeNow: 45,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=200&fit=crop",
    category: "Art & Design",
  },
  {
    id: "3",
    name: "Startup Hub",
    description: "Connect with entrepreneurs and share your startup journey",
    memberCount: 3210,
    activeNow: 124,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop",
    category: "Business",
  },
];

function RoomCard({ room }: { room: FeaturedRoom }) {
  const { t } = useLanguage();
  return (
    <Card hover className="overflow-hidden min-w-[280px] max-w-[280px] shrink-0">
      <div className="relative h-32">
        <Image
          src={room.image}
          alt={room.name}
          width={300}
          height={200}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        <Badge
          variant="primary"
          className="absolute top-2 left-2"
        >
          {room.category}
        </Badge>
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="font-semibold text-white truncate">{room.name}</h3>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm text-(--text-muted) line-clamp-2 mb-3">
          {room.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-(--text-muted)">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {room.memberCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {room.activeNow} {t("home", "active")}
            </span>
          </div>
          <Button variant="secondary" size="sm">
            {t("home", "join")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function FeaturedRooms() {
  const { t } = useLanguage();
  return (
    <div className="bg-(--bg-card) rounded-xl border border-(--border) p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary-500" />
          <h2 className="font-semibold text-lg">{t("home", "featuredRoomChats")}</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 gap-1">
          {t("home", "exploreAll")}
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {featuredRooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
