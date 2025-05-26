import { create } from "zustand";
import { GameRules, PLAYER, Player } from "@/types";

interface GameConfigState {
  boardSize: number;
  gameRules: GameRules;
  aiPlayer: Player;
  setBoardSize: (size: number) => void;
  setGameRules: (rules: GameRules) => void;
  setAiPlayer: (player: Player) => void;
  resetConfig: () => void;
}

const defaultConfig = {
  boardSize: 15,
  gameRules: {
    exactlyFiveRule: true,
    noBlockedWinsRule: false,
  },
  aiPlayer: PLAYER.WHITE as Player,
};

export const useGameConfig = create<GameConfigState>((set) => ({
  ...defaultConfig,
  setBoardSize: (size) => set({ boardSize: size }),
  setGameRules: (rules) => set({ gameRules: rules }),
  setAiPlayer: (player) => set({ aiPlayer: player }),
  resetConfig: () => set(defaultConfig),
}));
