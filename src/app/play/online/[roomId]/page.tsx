/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Suspense,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Board from "@/components/board-online";
import { UserIcon, Users } from "lucide-react";
import { ROLE } from "@/types";
import AblyContext from "@/contexts/ably-context";
import { Button } from "@/components/ui/button";
import { useDeleteRoom } from "@/services/api";

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const client = useContext(AblyContext);
  const clientId = client?.auth.clientId || "";
  const [role, setRole] = useState<(typeof ROLE)[keyof typeof ROLE] | null>(
    null
  );
  const [isWaiting, setIsWaiting] = useState(false);
  const [channel, setChannel] = useState<any>(null);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  const { mutateAsync: deleteRoomMutation } = useDeleteRoom();

  const cleanupRoom = useCallback(async () => {
    try {
      console.log("[GameRoom] Cleaning up room:", roomId);
      // Clear localStorage role
      localStorage.removeItem(`room:${roomId}:role`);
      console.log("[GameRoom] Cleared role from localStorage");

      await deleteRoomMutation(roomId);
      console.log("[GameRoom] Room deleted successfully");
    } catch (error) {
      console.error("[GameRoom] Error deleting room:", error);
    }
  }, [roomId, deleteRoomMutation]);

  // Get role from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem(`room:${roomId}:role`);
    console.log("[GameRoom] Retrieved role from localStorage:", storedRole);

    if (!storedRole) {
      console.log(
        "[GameRoom] No role found in localStorage, redirecting to join page"
      );
      router.push(`/play/online/join?room=${roomId}`);
      return;
    }

    setRole(storedRole as (typeof ROLE)[keyof typeof ROLE]);
  }, [roomId, router]);

  // Single useEffect to handle all channel operations
  useEffect(() => {
    if (!client || !clientId || !roomId || !role) {
      console.log("[GameRoom] Missing dependencies:", {
        client: !!client,
        clientId,
        roomId,
        role,
      });
      return;
    }

    console.log("[GameRoom] Initializing room:", roomId, "with role:", role);

    // Get or create channel reference
    const channel = client.channels.get(`game:${roomId}`);
    channelRef.current = channel;

    let isSubscribed = true;
    let presenceEntered = false;

    const handlePresenceUpdate = async (presenceMessage: {
      action: string;
      data: { role: string | null };
    }) => {
      if (!isSubscribed || !isMountedRef.current) return;

      console.log("[GameRoom] Presence update:", presenceMessage);

      try {
        // Wait a moment before checking presence
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!isSubscribed || !isMountedRef.current) return;

        // Update waiting state when presence changes
        const members = await channel.presence.get();
        if (!isSubscribed || !isMountedRef.current) return;

        const players = members.filter(
          (m) =>
            m.data?.role === ROLE.PLAYER_BLACK ||
            m.data?.role === ROLE.PLAYER_WHITE
        );
        const playerCount = players.length;

        if (playerCount === 0) {
          console.log(
            "[GameRoom] No players left in room, retrying in 2 seconds..."
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (!isSubscribed || !isMountedRef.current) return;

          const retryMembers = await channel.presence.get();
          const retryPlayers = retryMembers.filter(
            (m) =>
              m.data?.role === ROLE.PLAYER_BLACK ||
              m.data?.role === ROLE.PLAYER_WHITE
          );

          if (retryPlayers.length === 0) {
            console.log("[GameRoom] Still no players after retry, cleaning up");
            await cleanupRoom();
            if (isMountedRef.current) {
              router.push("/");
            }
            return;
          }
        }

        if (!isSubscribed || !isMountedRef.current) return;
        setIsWaiting(playerCount === 1);
      } catch (err) {
        console.error("[GameRoom] Error in presence handler:", err);
        if (isSubscribed && isMountedRef.current) {
          router.push("/");
        }
      }
    };

    const init = async () => {
      try {
        // Check channel state before attaching
        if (channel.state === "attaching") {
          console.log("[GameRoom] Channel is already attaching, waiting...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (channel.state !== "attached") {
          console.log("[GameRoom] Attaching to channel...");
          await channel.attach();
          console.log("[GameRoom] Channel attached successfully");
        } else {
          console.log("[GameRoom] Channel already attached");
        }

        if (!isSubscribed || !isMountedRef.current) return;

        // Set channel state for Board component
        setChannel(channel);

        // Subscribe to presence updates
        channel.presence.subscribe(handlePresenceUpdate);

        console.log("[GameRoom] Entering presence with role:", role);
        await channel.presence.enter({ role });
        presenceEntered = true;
        console.log("[GameRoom] Presence entered successfully");

        // Wait a moment to ensure presence is registered
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!isSubscribed || !isMountedRef.current) return;

        // Fetch current presence members
        console.log("[GameRoom] Fetching presence members...");
        const members = await channel.presence.get();
        console.log("[GameRoom] Current members:", members);

        if (!isSubscribed || !isMountedRef.current) return;

        if (!members || members.length === 0) {
          console.log(
            "[GameRoom] No members in room, retrying in 2 seconds..."
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (!isSubscribed || !isMountedRef.current) return;

          const retryMembers = await channel.presence.get();
          if (!retryMembers || retryMembers.length === 0) {
            console.log("[GameRoom] Still no members after retry, cleaning up");
            await cleanupRoom();
            if (isMountedRef.current) {
              router.push("/");
            }
            return;
          }
        }

        // Filter presence by client roles
        const players = members.filter(
          (m) =>
            m.data?.role === ROLE.PLAYER_BLACK ||
            m.data?.role === ROLE.PLAYER_WHITE
        );
        const playerCount = players.length;
        console.log("[GameRoom] Player count:", playerCount);

        if (!isSubscribed || !isMountedRef.current) return;

        if (playerCount === 0) {
          console.log(
            "[GameRoom] No players in room, retrying in 2 seconds..."
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (!isSubscribed || !isMountedRef.current) return;

          const retryMembers = await channel.presence.get();
          const retryPlayers = retryMembers.filter(
            (m) =>
              m.data?.role === ROLE.PLAYER_BLACK ||
              m.data?.role === ROLE.PLAYER_WHITE
          );

          if (retryPlayers.length === 0) {
            console.log("[GameRoom] Still no players after retry, cleaning up");
            await cleanupRoom();
            if (isMountedRef.current) {
              router.push("/");
            }
            return;
          }
        }

        if (!isSubscribed || !isMountedRef.current) return;

        if (playerCount === 1) {
          console.log("[GameRoom] Waiting for another player...");
          setIsWaiting(true);
        } else if (playerCount >= 2) {
          console.log("[GameRoom] Game is ready to play!");
          setIsWaiting(false);
        }
      } catch (err) {
        console.error("[GameRoom] Error during initialization:", err);
        if (isSubscribed && isMountedRef.current) {
          router.push("/");
        }
      }
    };

    init();

    // Cleanup function
    return () => {
      console.log("[GameRoom] Cleaning up channel operations");
      isSubscribed = false;

      const cleanup = async () => {
        try {
          if (channelRef.current) {
            // Unsubscribe from presence updates
            channelRef.current.presence.unsubscribe(handlePresenceUpdate);

            // Leave presence if we entered
            if (presenceEntered) {
              await channelRef.current.presence.leave();
            }

            // Only detach if channel is attached and not detaching
            if (channelRef.current.state === "attached") {
              await channelRef.current.detach();
            }
          }
        } catch (error) {
          console.error("[GameRoom] Error during cleanup:", error);
        }
      };

      cleanup();
    };
  }, [client, clientId, roomId, router, role, cleanupRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (isWaiting) {
    return (
      <div className="min-h-screen w-full">
        <Button
          className="absolute top-4 left-4"
          onClick={() => router.push("/")}
        >
          Back to Main Menu
        </Button>
        <Card className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="h-6 w-6" />
              Waiting for Opponent
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
              </div>
              <p className="text-blue-800 font-medium">
                Waiting for another player to join...
              </p>
              <p className="text-sm text-blue-600">Room Code: {roomId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      <Suspense fallback={<Loading />}>
        {role && (
          <Board
            roomId={roomId}
            role={role}
            channel={channel}
            members={channel?.presence?.members || []}
          />
        )}
      </Suspense>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen w-full">
      <Card className="min-h-screen w-full bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <UserIcon className="h-6 w-6" />
            Online Game
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-green-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
            </div>
            <p className="text-green-800 font-medium">Loading Online Game...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
