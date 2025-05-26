"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User, Eye, RefreshCw } from "lucide-react";
import { listOnlineRooms, RoomMetadata } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ROLE } from "@/types";
import AblyContext from "@/contexts/ably-context";
import { useQuery } from "@tanstack/react-query";

export function RoomList() {
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<RoomMetadata | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const client = useContext(AblyContext);

  // Use React Query to fetch and automatically refresh rooms
  const {
    data: rooms = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await listOnlineRooms();
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const handleRoomClick = (room: RoomMetadata) => {
    setSelectedRoom(room);
    setShowRoleDialog(true);
  };

  const handleJoinRoom = async (role: (typeof ROLE)[keyof typeof ROLE]) => {
    if (!selectedRoom || !client) return;

    try {
      const channel = client.channels.get(`game:${selectedRoom.room_name}`);
      await channel.attach();

      // Check current players
      const members = await channel.presence.get();
      const players = members.filter(
        (m) =>
          m.data?.role === ROLE.PLAYER_BLACK ||
          m.data?.role === ROLE.PLAYER_WHITE
      );

      // If joining as player, check if spots are available
      if (role === ROLE.PLAYER_BLACK || role === ROLE.PLAYER_WHITE) {
        const hasBlack = players.some(
          (m) => m.data?.role === ROLE.PLAYER_BLACK
        );
        const hasWhite = players.some(
          (m) => m.data?.role === ROLE.PLAYER_WHITE
        );

        if (
          (role === ROLE.PLAYER_BLACK && hasBlack) ||
          (role === ROLE.PLAYER_WHITE && hasWhite)
        ) {
          alert("This player spot is already taken!");
          return;
        }
      }

      localStorage.setItem(`room:${selectedRoom.room_name}:role`, role);
      router.push(`/play/online/${selectedRoom.room_name}`);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please try again.");
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Available Rooms</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center gap-1"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/play/online/create")}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Create Room
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rooms available. Create one to start playing!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleRoomClick(room)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{room.room_name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Host: {room.host_client_id}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              How would you like to join {selectedRoom?.room_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button
              onClick={() => handleJoinRoom(ROLE.PLAYER_BLACK)}
              className="w-full bg-black hover:bg-gray-800"
            >
              <User className="w-4 h-4 mr-2" />
              Join as Black
            </Button>
            <Button
              onClick={() => handleJoinRoom(ROLE.PLAYER_WHITE)}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              <User className="w-4 h-4 mr-2" />
              Join as White
            </Button>
            <Button
              onClick={() => handleJoinRoom(ROLE.SPECTATOR)}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Join as Spectator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
