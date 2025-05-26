import React from "react";
import { PLAYER, Position } from "@/types";

interface GameBoardProps {
  board: number[][];
  boardSize: number;
  winningCells: Position[];
  hoverPosition: Position | null;
  onCellClick: (row: number, col: number) => void;
  lastMove: Position | null;
}

export function GameBoard({
  board,
  boardSize,
  winningCells,
  hoverPosition,
  onCellClick,
  lastMove,
}: GameBoardProps) {
  const getCellClassName = (row: number, col: number) => {
    const isWinningCell = winningCells.some(
      (cell) => cell.row === row && cell.col === col
    );
    const isHovered =
      hoverPosition && hoverPosition.row === row && hoverPosition.col === col;
    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;

    return `relative flex items-center justify-center border border-gray-300 ${
      isWinningCell ? "bg-green-200" : ""
    } ${isHovered ? "bg-gray-200" : ""} ${
      isLastMove ? "ring-2 ring-blue-500 ring-offset-2" : ""
    }`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="bg-amber-100 p-2 rounded-lg shadow-md w-full h-full flex items-center justify-center">
        <div
          className="grid gap-0 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${boardSize}, 1fr)`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={getCellClassName(rowIndex, colIndex)}
                onClick={() => onCellClick(rowIndex, colIndex)}
                disabled={cell !== PLAYER.NONE}
                aria-label={`Place stone at row ${rowIndex + 1}, column ${
                  colIndex + 1
                }`}
              >
                {cell === PLAYER.BLACK && (
                  <div className="w-[80%] h-[80%] rounded-full bg-black shadow-md"></div>
                )}
                {cell === PLAYER.WHITE && (
                  <div className="w-[80%] h-[80%] rounded-full bg-white border border-gray-300 shadow-md"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
