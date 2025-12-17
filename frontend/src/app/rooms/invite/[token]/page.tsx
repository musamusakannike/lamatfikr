"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { roomsApi } from "@/lib/api/rooms";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Clock,
  Crown,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

interface JoinRoomData {
  id: string;
  name: string;
  description: string;
  image?: string;
  category: string;
  membershipType?: string;
  price?: number;
  currency?: string;
}

type JoinStatus = "loading" | "approved" | "pending" | "error";

export default function JoinViaInviteLinkPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const isValidToken = Boolean(token);
  const [status, setStatus] = useState<JoinStatus>(isValidToken ? "loading" : "error");
  const [error, setError] = useState(isValidToken ? "" : t("roomInvite", "invalidInviteLink"));
  const [room, setRoom] = useState<JoinRoomData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const joinRoom = async () => {
      try {
        const response = await roomsApi.joinViaInviteLink(token);
        
        setRoom(response.room);
        setMessage(response.message);
        
        if (response.status === "pending") {
          setStatus("pending");
        } else {
          setStatus("approved");
          setTimeout(() => {
            router.push(`/rooms?roomId=${response.room.id}`);
          }, 2000);
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setStatus("error");
      }
    };

    joinRoom();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-(--bg)">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={cn("pt-16", "lg:pl-64")}>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
            <Card className="w-full max-w-md p-8 text-center space-y-6">
              {status === "loading" ? (
                <>
                  <div className="flex justify-center">
                    <Loader2 size={48} className="animate-spin text-primary-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      {t("roomInvite", "joiningRoom")}
                    </h1>
                    <p className="text-(--text-muted)">
                      {t("roomInvite", "processingInvite")}
                    </p>
                  </div>
                </>
              ) : status === "approved" && room ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      {t("roomInvite", "welcomeTo")} {room.name}!
                    </h1>
                    <p className="text-(--text-muted) mb-4">
                      {t("roomInvite", "successfullyJoined")}
                    </p>
                  </div>

                  {/* Room Preview */}
                  <div className="bg-(--bg-secondary) rounded-lg p-4 space-y-3 text-left">
                    {room.image && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <Image
                          src={room.image}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-(--text)">
                        {room.name}
                      </h3>
                      <p className="text-sm text-(--text-muted) mt-1">
                        {room.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/rooms?roomId=${room.id}`)}
                    variant="primary"
                    className="w-full"
                  >
                    {t("roomInvite", "openRoom")}
                    <ArrowRight size={18} />
                  </Button>
                </>
              ) : status === "pending" && room ? (
                <>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Clock size={32} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      {t("roomInvite", "requestSubmitted")}
                    </h1>
                    <p className="text-(--text-muted) mb-2">
                      {message}
                    </p>
                  </div>

                  {/* Room Preview */}
                  <div className="bg-(--bg-secondary) rounded-lg p-4 space-y-3 text-left">
                    {room.image && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <Image
                          src={room.image}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-(--text) flex items-center gap-2">
                        {room.name}
                        {room.membershipType === "paid" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs">
                            <Crown size={12} />
                            {t("roomInvite", "premium")}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-(--text-muted) mt-1">
                        {room.description}
                      </p>
                    </div>
                    {room.membershipType === "paid" && room.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-(--text-muted)">{t("roomInvite", "membershipFee")}</span>
                        <span className="font-semibold text-(--text)">
                          ${room.price} {room.currency || "USD"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-(--text-muted) text-sm">
                      <Lock size={14} />
                      <span>{t("roomInvite", "privateRoom")}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <Clock size={20} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                          {t("roomInvite", "awaitingApproval")}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          {room.membershipType === "paid"
                            ? t("roomInvite", "paidRoomPendingNote")
                            : t("roomInvite", "freeRoomPendingNote")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push("/rooms")}
                    variant="primary"
                    className="w-full"
                  >
                    {t("payment", "backToRooms")}
                  </Button>
                </>
              ) : status === "error" ? (
                <>
                  <div className="flex justify-center">
                    <AlertCircle size={48} className="text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      {t("roomInvite", "unableToJoin")}
                    </h1>
                    <p className="text-(--text-muted) mb-4">{error}</p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => router.push("/rooms")}
                      variant="primary"
                      className="w-full"
                    >
                      {t("payment", "backToRooms")}
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="secondary"
                      className="w-full"
                    >
                      {t("payment", "tryAgain")}
                    </Button>
                  </div>

                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300">
                    <p className="font-semibold mb-1">{t("roomInvite", "possibleReasons")}</p>
                    <ul className="text-left space-y-1 text-xs">
                      <li>• {t("roomInvite", "linkExpired")}</li>
                      <li>• {t("roomInvite", "maxUsesReached")}</li>
                      <li>• {t("roomInvite", "linkRevoked")}</li>
                      <li>• {t("roomInvite", "roomNoLongerExists")}</li>
                    </ul>
                  </div>
                </>
              ) : null}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
