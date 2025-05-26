"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useCreateRoom } from "@/services/api";
import { ROLE } from "@/types";
import AblyContext from "@/contexts/ably-context";
import { Copy } from "lucide-react";

export default function CreateRoom() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const client = useContext(AblyContext);
  const clientId = client?.auth.clientId || "";
  const { mutateAsync: createRoomMutation } = useCreateRoom();

  const generateRoomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleCreateRoom = async () => {
    if (!client) return;

    setIsCreating(true);

    try {
      const channel = client.channels.get(`game:${roomCode}`);

      // Store role in localStorage before attaching to channel
      localStorage.setItem(`room:${roomCode}:role`, ROLE.PLAYER_BLACK);
      console.log(
        `[CreateRoom] Stored role ${ROLE.PLAYER_BLACK} for room ${roomCode}`
      );

      // Attach to channel before doing anything
      await channel.attach();
      console.log("[CreateRoom] Channel attached");

      // Enter presence as host with role "player_black"
      await channel.presence.enter({ role: ROLE.PLAYER_BLACK });
      console.log("[CreateRoom] Presence entered");

      // Wait a moment to ensure presence is registered
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Store room metadata in backend (if applicable)
      await createRoomMutation({
        room_name: roomCode,
        host_client_id: clientId,
      });
      console.log("[CreateRoom] Room created in backend");

      // Notify that room was created
      await channel.publish("room-created", {
        roomId: roomCode,
        hostId: clientId,
        role: ROLE.PLAYER_BLACK,
        timestamp: Date.now(),
      });
      console.log("[CreateRoom] Room created notification sent");

      // Redirect to the game room
      router.push(`/play/online/${roomCode}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      alert("Failed to create room. Please try again.");
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy room code:", err);
    }
  };

  useEffect(() => {
    if (clientId) {
      const newRoomCode = generateRoomCode();
      setRoomCode(newRoomCode);
    }
  }, [clientId]);

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Game Room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 flex justify-center items-center flex-col">
            <Label htmlFor="roomCode">Room Code</Label>
            <div className="flex items-center gap-2">
              <h1 className="text-center font-mono text-lg">{roomCode}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="h-8 w-8 relative"
                title="Copy room code"
              >
                <Copy className="h-4 w-4" />
                {copied && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs">
                    Copied!
                  </span>
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isCreating ? "Creating Room..." : "Create Room"}
          </Button>
          <Button
            onClick={() => router.push("/")}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700"
          >
            Back to Main Menu
          </Button>

          <div className="text-center text-sm text-gray-500">
            Share the room code with your friend to play together
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
