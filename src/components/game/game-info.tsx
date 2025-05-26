import React from "react";
import { PLAYER } from "@/types";

interface GameInfoProps {
  currentPlayer: number;
  gameOver: boolean;
  aiThinking: boolean;
}

export function GameInfo({
  currentPlayer,
  gameOver,
  aiThinking,
}: GameInfoProps) {
  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <div className="text-lg font-semibold">
        {gameOver ? (
          "Game Over"
        ) : aiThinking ? (
          "AI is thinking..."
        ) : (
          <>
            Current Player:{" "}
            <span
              className={`inline-block w-4 h-4 rounded-full ${
                currentPlayer === PLAYER.BLACK
                  ? "bg-black"
                  : "bg-white border border-gray-300"
              }`}
            />
          </>
        )}
      </div>
    </div>
  );
}
