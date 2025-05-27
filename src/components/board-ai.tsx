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

interface GomokuBoardAIProps {
  isAIGame?: boolean;
  aiPlayer?: Player;
  onAIMove?: (
    move: Position,
    evaluations: Array<{ position: Position; score: number }>
  ) => void;
}

export default function BoardAI({
  isAIGame = false,
  aiPlayer = PLAYER.WHITE,
  onAIMove,
}: GomokuBoardAIProps) {
  const router = useRouter();
  const { boardSize, gameRules, setBoardSize, setGameRules, setAiPlayer } =
    useGameConfig();

  // Sound hooks
  const [playMove] = useSound("/sounds/move.mp3", { volume: 0.5 });
  const [playWin] = useSound("/sounds/win.mp3", { volume: 0.5 });

  // Game state
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(boardSize),
    currentPlayer: PLAYER.BLACK,
    winner: null,
    winningCells: [],
    gameOver: false,
    lastMove: null,
    gameId: undefined,
  }));

  // Add move history state

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
      aiThinking ||
      (isAIGame && gameState.currentPlayer === aiPlayer)
    ) {
      return;
    }

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
    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      lastMove: { row, col },
      currentPlayer:
        gameState.currentPlayer === PLAYER.BLACK ? PLAYER.WHITE : PLAYER.BLACK,
      winner: null,
      gameOver: false,
    };

    if (winResult.isWin) {
      newGameState.winner = gameState.currentPlayer;
      newGameState.winningCells = winResult.winningCells;
      newGameState.gameOver = true;
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
      newGameState.gameOver = true;
      newGameState.winner = 0;
    }

    setGameState(newGameState);
  };

  const handleAIMove = useCallback(async () => {
    if (
      gameState.gameOver ||
      !isAIGame ||
      gameState.currentPlayer !== aiPlayer ||
      !gameState.lastMove
    ) {
      return;
    }

    setAiThinking(true);
    try {
      let currentRoundGameId = gameState.gameId;

      if (!currentRoundGameId) {
        // Include blocked5 in START command if the rule is enabled
        const startCommand = gameRules.noBlockedWinsRule
          ? `START ${boardSize} blocked5`
          : `START ${boardSize}`;

        const startResponse = await getAIMove({
          command: startCommand,
        });

        if (
          startResponse.data.game_id &&
          (startResponse.data.move === "OK" ||
            startResponse.data.move === "OK (blocked5 enabled)")
        ) {
          currentRoundGameId = startResponse.data.game_id;
          setGameState((prev) => ({ ...prev, gameId: currentRoundGameId }));
        } else {
          console.error(
            "AI START command failed or gave unexpected response",
            startResponse.data
          );
          setAiThinking(false);
          return;
        }
      }

      const humanMove = gameState.lastMove;
      const turnCommand = `TURN ${humanMove.row},${humanMove.col}`;

      const aiTurnResponse = await getAIMove({
        game_id: currentRoundGameId,
        command: turnCommand,
      });

      const aiMoveString = aiTurnResponse.data.move;
      if (
        !aiMoveString ||
        aiMoveString === "OK" ||
        !aiMoveString.includes(",")
      ) {
        console.error("AI did not return a valid move string:", aiMoveString);
        setAiThinking(false);
        return;
      }

      const [aiRow, aiCol] = aiMoveString.split(",").map(Number);
      const aiActualMove = { row: aiRow, col: aiCol };

      if (onAIMove) {
        onAIMove(aiActualMove, []);
      }

      const newBoard = gameState.board.map((rowArray) => [...rowArray]);
      if (
        newBoard[aiActualMove.row] &&
        newBoard[aiActualMove.row][aiActualMove.col] === PLAYER.NONE
      ) {
        newBoard[aiActualMove.row][aiActualMove.col] = gameState.currentPlayer;
      } else {
        console.error("AI returned an invalid move:", aiActualMove);
        setAiThinking(false);
        return;
      }
      playMove();

      const winResult = checkWin(
        newBoard,
        aiActualMove.row,
        aiActualMove.col,
        gameState.currentPlayer,
        boardSize,
        gameRules.exactlyFiveRule,
        gameRules.noBlockedWinsRule
      );

      const nextGameState: GameState = {
        ...gameState,
        board: newBoard,
        lastMove: aiActualMove,
        gameId: currentRoundGameId,
        currentPlayer:
          gameState.currentPlayer === PLAYER.BLACK
            ? PLAYER.WHITE
            : PLAYER.BLACK,
      };

      if (winResult.isWin) {
        nextGameState.winner = gameState.currentPlayer;
        nextGameState.winningCells = winResult.winningCells;
        nextGameState.gameOver = true;
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
        nextGameState.gameOver = true;
        nextGameState.winner = 0;
      }
      setGameState(nextGameState);
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
    gameRules.exactlyFiveRule,
    gameRules.noBlockedWinsRule,
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
    gameState.lastMove,
    isAIGame,
    aiThinking,
    aiPlayer,
    handleAIMove,
  ]);

  const resetGameLogic = () => {
    setGameState({
      board: createEmptyBoard(boardSize),
      currentPlayer: PLAYER.BLACK,
      winner: null,
      winningCells: [],
      gameOver: false,
      lastMove: null,
      gameId: undefined,
    });
  };

  const handleBoardSizeChange = (newSize: number) => {
    setBoardSize(newSize);
    resetGameLogic();
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
        onReset={resetGameLogic}
        onOpenConfig={() => setConfigOpen(true)}
        onRedo={() => {}}
        canRedo={false}
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
        onReset={resetGameLogic}
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
        onPlayAgain={resetGameLogic}
      />
    </div>
  );
}
