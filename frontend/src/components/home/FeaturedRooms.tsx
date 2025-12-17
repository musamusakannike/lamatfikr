"use client";

import { useState, useEffect } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { Users, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { featuredRoomsApi, FeaturedRoomData } from "@/lib/api/featured-rooms";
import { getErrorMessage } from "@/lib/api";

function RoomCard({ room }: { room: FeaturedRoomData }) {
  const { t } = useLanguage();
  const roomData = room.roomId;
  
  return (
    <Link href={`/rooms?roomId=${roomData._id}`}>
      <Card hover className="overflow-hidden min-w-[280px] max-w-[280px] shrink-0">
        <div className="relative h-32">
          <Image
            src={roomData.image || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop"}
            alt={roomData.name}
            width={300}
            height={200}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <Badge
            variant="primary"
            className="absolute top-2 left-2"
          >
            {roomData.category}
          </Badge>
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 bg-yellow-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
              <Sparkles size={12} />
              Featured
            </div>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="font-semibold text-white truncate">{roomData.name}</h3>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm text-(--text-muted) line-clamp-2 mb-3">
            {roomData.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-(--text-muted)">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {roomData.memberCount.toLocaleString()}
              </span>
              {roomData.membershipType === "paid" && roomData.price && (
                <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold">
                  {roomData.currency || "USD"} {roomData.price}
                </span>
              )}
            </div>
            <Button variant="secondary" size="sm">
              {t("home", "join")}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function FeaturedRooms() {
  const { t } = useLanguage();
  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeaturedRooms = async () => {
      try {
        setLoading(true);
        const response = await featuredRoomsApi.getFeaturedRooms({ limit: 10 });
        setFeaturedRooms(response.featuredRooms);
      } catch (err) {
        setError(getErrorMessage(err));
        console.error("Error fetching featured rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedRooms();
  }, []);

  if (loading) {
    return (
      <div className="bg-(--bg-card) rounded-xl border border-(--border) p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error || featuredRooms.length === 0) {
    return null;
  }

  return (
    <div className="bg-(--bg-card) rounded-xl border border-(--border) p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-yellow-500" />
          <h2 className="font-semibold text-lg">{t("home", "featuredRoomChats")}</h2>
        </div>
        <Link href="/rooms">
          <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 gap-1">
            {t("home", "exploreAll")}
            <ChevronRight size={16} />
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {featuredRooms.map((room) => (
          <RoomCard key={room._id} room={room} />
        ))}
      </div>
    </div>
  );
}
