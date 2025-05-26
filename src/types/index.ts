export const PLAYER = {
  NONE: 0,
  BLACK: 1,
  WHITE: 2,
} as const;

export type Player = (typeof PLAYER)[keyof typeof PLAYER];

export interface Position {
  row: number;
  col: number;
}

export type Board = number[][];

export interface WinResult {
  isWin: boolean;
  winningCells: Position[];
}

export interface GameState {
  board: number[][];
  currentPlayer: Player;
  winner: Player | null;
  winningCells: Position[];
  gameOver: boolean;
  lastMove: Position | null;
}

export interface GameRules {
  exactlyFiveRule: boolean;
  noBlockedWinsRule: boolean;
}

export interface AIMove {
  move: Position;
  evaluations: Array<{ position: Position; score: number }>;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  winningCells: Position[];
  gameOver: boolean;
  lastMove: Position | null;
}

export interface GameRules {
  exactlyFiveRule: boolean;
  noBlockedWinsRule: boolean;
}

export enum ROLE {
  PLAYER_BLACK = "PLAYER_BLACK",
  PLAYER_WHITE = "PLAYER_WHITE",
  SPECTATOR = "SPECTATOR",
}

export type Role = (typeof ROLE)[keyof typeof ROLE];
