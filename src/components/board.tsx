import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { PLAYER, Position, GameState, Player } from "@/types";
import {
  createEmptyBoard,
  checkWin,
  checkDraw,
} from "@/components/game/game-logic";
import { GameBoard } from "@/components/game/game-board";
import { GameInfo } from "@/components/game/game-info";
import { GameControls } from "@/components/game/game-controls";
import { ConfigDialog } from "@/components/dialogs/config-dialog";
import { SurrenderDialog } from "@/components/dialogs/surrender-dialog";
import { WinDialog } from "@/components/dialogs/win-dialog";
import { useGameConfig } from "@/store/game-config";
import React from "react";
import { getAIMove } from "@/services/api";
import useSound from "use-sound";

interface GomokuBoardProps {
  isAIGame?: boolean;
  aiPlayer?: Player;
  onAIMove?: (
    move: Position,
    evaluations: Array<{ position: Position; score: number }>
  ) => void;
}

export default function GomokuBoard({
  isAIGame = false,
  aiPlayer = PLAYER.WHITE,
  onAIMove,
}: GomokuBoardProps) {
  const router = useRouter();
  const { boardSize, gameRules, setBoardSize, setGameRules, setAiPlayer } =
    useGameConfig();

  // Sound hooks
  const [playMove] = useSound("/sounds/move.mp3", { volume: 0.5 });
  const [playWin] = useSound("/sounds/win.mp3", { volume: 0.5 });

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(boardSize),
    currentPlayer: PLAYER.BLACK,
    winner: null,
    winningCells: [],
    gameOver: false,
    lastMove: null,
  });

  // Add move history state
  const [moveHistory, setMoveHistory] = useState<GameState[]>([]);
  const [canRedo, setCanRedo] = useState(false);

  // UI state
  const [showConfirmSurrender, setShowConfirmSurrender] = useState(false);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [hoverPosition] = useState<Position | null>(null);

  // AI state
  const [aiThinking, setAiThinking] = useState(false);

  const handleCellClick = (row: number, col: number) => {
    if (
      gameState.board[row][col] !== PLAYER.NONE ||
      gameState.gameOver ||
      aiThinking
    )
      return;
    if (isAIGame && gameState.currentPlayer === aiPlayer) return;

    const newBoard = gameState.board.map((rowArray) => [...rowArray]);
    newBoard[row][col] = gameState.currentPlayer;

    playMove();

    const winResult = checkWin(
      newBoard,
      row,
      col,
      gameState.currentPlayer,
      boardSize,
      gameRules.exactlyFiveRule,
      gameRules.noBlockedWinsRule
    );

    // Save current state to history before updating
    setMoveHistory((prev) => [...prev, gameState]);
    setCanRedo(true);

    if (winResult.isWin) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        winner: prev.currentPlayer,
        winningCells: winResult.winningCells,
        gameOver: true,
        lastMove: { row, col },
      }));
      setShowWinDialog(true);
      setCanRedo(false);

      playWin();

      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 100);
    } else {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer:
          prev.currentPlayer === PLAYER.BLACK ? PLAYER.WHITE : PLAYER.BLACK,
        lastMove: { row, col },
      }));
    }
  };

  const handleAIMove = useCallback(async () => {
    if (gameState.gameOver || !isAIGame || gameState.currentPlayer !== aiPlayer)
      return;

    setAiThinking(true);
    try {
      const response = await getAIMove({
        board: gameState.board,
        current_player: gameState.currentPlayer,
        game_rules: {
          exactlyFiveRule: gameRules.exactlyFiveRule,
          noBlockedWinsRule: gameRules.noBlockedWinsRule,
        },
      });

      const { move } = response.data;

      if (onAIMove) {
        onAIMove(move, []);
      }

      const newBoard = gameState.board.map((rowArray) => [...rowArray]);
      newBoard[move.row][move.col] = gameState.currentPlayer;

      playMove();

      const winResult = checkWin(
        newBoard,
        move.row,
        move.col,
        gameState.currentPlayer,
        boardSize,
        gameRules.exactlyFiveRule,
        gameRules.noBlockedWinsRule
      );

      if (winResult.isWin) {
        setGameState({
          ...gameState,
          board: newBoard,
          gameOver: true,
          winner: gameState.currentPlayer,
          winningCells: winResult.winningCells,
          lastMove: move,
        });
        setShowWinDialog(true);
        playWin();

        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 100);
      } else if (checkDraw(newBoard)) {
        setGameState({
          ...gameState,
          board: newBoard,
          gameOver: true,
          winner: 0,
          lastMove: move,
        });
      } else {
        setGameState({
          ...gameState,
          board: newBoard,
          currentPlayer:
            gameState.currentPlayer === PLAYER.BLACK
              ? PLAYER.WHITE
              : PLAYER.BLACK,
          lastMove: move,
        });
      }
    } catch (error) {
      console.error("Error getting AI move:", error);
    } finally {
      setAiThinking(false);
    }
  }, [
    gameState,
    isAIGame,
    aiPlayer,
    boardSize,
    gameRules,
    onAIMove,
    playMove,
    playWin,
  ]);

  useEffect(() => {
    const shouldMakeAIMove =
      isAIGame &&
      !gameState.gameOver &&
      !aiThinking &&
      gameState.currentPlayer === aiPlayer;

    if (shouldMakeAIMove) {
      handleAIMove();
    }
  }, [
    gameState.currentPlayer,
    gameState.gameOver,
    isAIGame,
    aiThinking,
    aiPlayer,
    handleAIMove,
  ]);

  const handleRedoMove = () => {
    if (moveHistory.length > 0) {
      const previousState = moveHistory[moveHistory.length - 1];
      setGameState(previousState);
      setMoveHistory((prev) => prev.slice(0, -1));
      setCanRedo(moveHistory.length > 1);
    }
  };

  const resetGame = () => {
    setGameState({
      board: createEmptyBoard(boardSize),
      currentPlayer: PLAYER.BLACK,
      winner: null,
      winningCells: [],
      gameOver: false,
      lastMove: null,
    });
    setMoveHistory([]);
    setCanRedo(false);
  };

  const handleBoardSizeChange = (newSize: number) => {
    setBoardSize(newSize);
    setGameState({
      board: createEmptyBoard(newSize),
      currentPlayer: PLAYER.BLACK,
      winner: null,
      winningCells: [],
      gameOver: false,
      lastMove: null,
    });
  };

  const handleSurrender = () => {
    setGameState((prev) => ({
      ...prev,
      winner: prev.currentPlayer === PLAYER.BLACK ? PLAYER.WHITE : PLAYER.BLACK,
      gameOver: true,
    }));
    setShowWinDialog(true);
    setShowConfirmSurrender(false);

    playWin();

    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 100);
  };

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 w-full max-w-full overflow-hidden">
      <GameInfo
        currentPlayer={gameState.currentPlayer}
        gameOver={gameState.gameOver}
        aiThinking={aiThinking}
      />

      <GameControls
        gameOver={gameState.gameOver}
        aiThinking={aiThinking}
        onBackToMenu={() => router.push("/")}
        onSurrender={() => setShowConfirmSurrender(true)}
        onReset={resetGame}
        onOpenConfig={() => setConfigOpen(true)}
        onRedo={handleRedoMove}
        canRedo={canRedo}
        canReset={true}
        canConfig={true}
        canSurrender={true}
      />

      <div className="w-full max-w-[min(100vw-2rem,600px)] aspect-square">
        <GameBoard
          board={gameState.board}
          boardSize={boardSize}
          winningCells={gameState.winningCells}
          hoverPosition={hoverPosition}
          onCellClick={handleCellClick}
          lastMove={gameState.lastMove}
        />
      </div>

      <ConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        boardSize={boardSize}
        onBoardSizeChange={handleBoardSizeChange}
        gameRules={gameRules}
        onRulesChange={setGameRules}
        isAIGame={isAIGame}
        aiPlayer={aiPlayer}
        onAiPlayerChange={setAiPlayer}
        onReset={resetGame}
      />

      <SurrenderDialog
        open={showConfirmSurrender}
        onOpenChange={setShowConfirmSurrender}
        onConfirm={handleSurrender}
      />

      <WinDialog
        open={showWinDialog}
        onOpenChange={setShowWinDialog}
        winner={gameState.winner}
        onPlayAgain={resetGame}
      />
    </div>
  );
}
