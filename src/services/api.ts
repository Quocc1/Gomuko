import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface RoomCreateRequest {
  room_name: string;
  host_client_id: string;
}

export interface RoomMetadata {
  id: number;
  room_name: string;
  host_client_id: string;
}

export interface RoomDetail {
  room_name: string;
  host_client_id: string;
}

export interface AIMoveRequest {
  board: number[][];
  current_player: number;
  game_rules: {
    exactlyFiveRule: boolean;
    noBlockedWinsRule: boolean;
  };
}

export interface AIMoveResponse {
  move: {
    row: number;
    col: number;
  };
}

export const createRoom = (data: RoomCreateRequest) =>
  apiClient.post<RoomDetail>("/rooms", data);

export const listOnlineRooms = () => apiClient.get<RoomMetadata[]>("/rooms");

export const getRoom = (roomName: string) =>
  apiClient.get<RoomDetail | null>(`/rooms/${roomName}`);

export const deleteRoomApi = (roomName: string) =>
  apiClient.delete(`/rooms/${roomName}`);

export const getAIMove = (data: AIMoveRequest) =>
  apiClient.post<AIMoveResponse>("/ai/move", data);

// React Query hooks
export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      // Invalidate and refetch rooms list
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoomApi,
    onSuccess: () => {
      // Invalidate and refetch rooms list
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};
