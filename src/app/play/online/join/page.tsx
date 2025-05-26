"use client";

import { useContext, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/types";
import AblyContext from "@/contexts/ably-context";
import { User, Eye } from "lucide-react";

type Role = (typeof ROLE)[keyof typeof ROLE];

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") || "";
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>(ROLE.PLAYER_BLACK);
  const [isTwoPlayers, setIsTwoPlayers] = useState(false);

  const client = useContext(AblyContext);

  useEffect(() => {
    if (!roomId) {
      router.push("/");
      return;
    }

    const checkRoom = async () => {
      try {
        const channel = client?.channels.get(`game:${roomId}`);
        if (!channel) return;

        await channel.attach();
        const members = await channel.presence.get();
        const players = members.filter(
          (m) =>
            m.data?.role === ROLE.PLAYER_BLACK ||
            m.data?.role === ROLE.PLAYER_WHITE
        );
        setIsTwoPlayers(players.length >= 2);
      } catch (err) {
        console.error("Error checking room:", err);
        setError("Failed to check room status. Please try again.");
      }
    };

    if (client) {
      checkRoom();
    }
  }, [client, roomId, router]);

  const handleJoinRoom = async () => {
    if (!client || !roomId) return;

    setIsJoining(true);
    setError("");

    try {
      const channel = client.channels.get(`game:${roomId}`);
      await channel.attach();

      // Check current players
      const members = await channel.presence.get();
      const players = members.filter(
        (m) =>
          m.data?.role === ROLE.PLAYER_BLACK ||
          m.data?.role === ROLE.PLAYER_WHITE
      );

      // If joining as player, check if spots are available
      if (selectedRole === ROLE.PLAYER_BLACK || selectedRole === ROLE.PLAYER_WHITE) {
        const hasBlack = players.some((m) => m.data?.role === ROLE.PLAYER_BLACK);
        const hasWhite = players.some((m) => m.data?.role === ROLE.PLAYER_WHITE);

        if (
          (selectedRole === ROLE.PLAYER_BLACK && hasBlack) ||
          (selectedRole === ROLE.PLAYER_WHITE && hasWhite)
        ) {
          setError("This player spot is already taken!");
          setIsJoining(false);
          return;
        }
      }

      // Store role in localStorage
      localStorage.setItem(`room:${roomId}:role`, selectedRole);

      // Enter presence with role
      await channel.presence.enter({ role: selectedRole });

      // Redirect to game room
      router.push(`/play/online/${roomId}`);
    } catch (err) {
      console.error("Failed to join room:", err);
      setError("Failed to join room. Please try again.");
      setIsJoining(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join Game Room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Room Code</Label>
            <h1 className="text-center font-mono text-lg">{roomId}</h1>
          </div>

          <div className="space-y-4">
            <Label>Select Your Role</Label>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setSelectedRole(ROLE.PLAYER_BLACK)}
                className={`w-full ${
                  selectedRole === ROLE.PLAYER_BLACK
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
                disabled={isJoining || isTwoPlayers}
              >
                <User className="w-4 h-4 mr-2" />
                Join as Black
              </Button>
              <Button
                onClick={() => setSelectedRole(ROLE.PLAYER_WHITE)}
                className={`w-full ${
                  selectedRole === ROLE.PLAYER_WHITE
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
                disabled={isJoining || isTwoPlayers}
              >
                <User className="w-4 h-4 mr-2" />
                Join as White
              </Button>
              <Button
                onClick={() => setSelectedRole(ROLE.SPECTATOR)}
                className={`w-full ${
                  selectedRole === ROLE.SPECTATOR
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
                disabled={isJoining}
              >
                <Eye className="w-4 h-4 mr-2" />
                Join as Spectator
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <Button
            onClick={handleJoinRoom}
            disabled={isJoining}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isJoining ? "Joining Room..." : "Join Room"}
          </Button>
          <Button
            onClick={() => router.push("/")}
            disabled={isJoining}
            className="w-full bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700"
          >
            Back to Main Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Loading...</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function JoinRoom() {
  return (
    <Suspense fallback={<Loading />}>
      <JoinRoomContent />
    </Suspense>
  );
}
