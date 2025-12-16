"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar, Sidebar } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { roomsApi, Room } from "@/lib/api/rooms";
import { getErrorMessage } from "@/lib/api";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Users,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

export default function JoinViaInviteLinkPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    const joinRoom = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await roomsApi.joinViaInviteLink(token);
        setRoom(response.data.room);
        setSuccess(true);

        setTimeout(() => {
          router.push(`/rooms?roomId=${response.data.room.id}`);
        }, 2000);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    joinRoom();
  }, [token, router]);

  return (
    <div className="flex h-screen bg-(--bg)">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
            <Card className="w-full max-w-md p-8 text-center space-y-6">
              {loading ? (
                <>
                  <div className="flex justify-center">
                    <Loader2 size={48} className="animate-spin text-primary-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      Joining Room...
                    </h1>
                    <p className="text-(--text-muted)">
                      Please wait while we process your invite link.
                    </p>
                  </div>
                </>
              ) : success && room ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      Welcome to {room.name}!
                    </h1>
                    <p className="text-(--text-muted) mb-4">
                      You've successfully joined the room. Redirecting you now...
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
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1 text-(--text-muted)">
                        <Users size={16} />
                        <span>{room.memberCount} members</span>
                      </div>
                      {room.isPrivate && (
                        <div className="flex items-center gap-1 text-(--text-muted)">
                          <Lock size={16} />
                          <span>Private</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      router.push(`/rooms?roomId=${room.id}`)
                    }
                    variant="primary"
                    className="w-full"
                  >
                    Open Room
                    <ArrowRight size={18} />
                  </Button>
                </>
              ) : error ? (
                <>
                  <div className="flex justify-center">
                    <AlertCircle size={48} className="text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-(--text) mb-2">
                      Unable to Join
                    </h1>
                    <p className="text-(--text-muted) mb-4">{error}</p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => router.push("/rooms")}
                      variant="primary"
                      className="w-full"
                    >
                      Back to Rooms
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="secondary"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>

                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300">
                    <p className="font-semibold mb-1">Possible reasons:</p>
                    <ul className="text-left space-y-1 text-xs">
                      <li>• The invite link has expired</li>
                      <li>• The link has reached its maximum uses</li>
                      <li>• The link has been revoked</li>
                      <li>• The room no longer exists</li>
                    </ul>
                  </div>
                </>
              ) : null}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
